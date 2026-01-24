import { sessions, messages, getConnectionById, deleteSession } from "@/data/dummy";
import { runClaudeCode, parseStreamLine } from "@/lib/claude-cli";
import { streamChat, ChatMessage } from "@/lib/anthropic";
import { Message, ClaudeCodeConnection, AgentSdkConnection } from "@/types/project";
import { randomUUID } from "crypto";
import { createLogger } from "@/lib/logger";

const log = createLogger("session-api");

function getSession(sessionId: string) {
  return sessions.find((s) => s.id === sessionId);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const session = getSession(sessionId);

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const sessionMessages = messages.get(sessionId) || [];
  return Response.json({ session, messages: sessionMessages });
}

function createClaudeCodeStream(
  sessionId: string,
  prompt: string,
  connection: ClaudeCodeConnection,
  session: { lastActivity: Date }
) {
  const encoder = new TextEncoder();

  log.info("Creating Claude Code stream", { sessionId, workingDir: connection.workingDir });

  return new ReadableStream({
    start(controller) {
      const child = runClaudeCode(prompt, connection.workingDir, sessionId);
      let assistantContent = "";
      let buffer = "";
      let eventCount = 0;

      child.stdout?.on("data", (data: Buffer) => {
        const rawData = data.toString();
        log.debug("Received stdout data", { length: rawData.length, preview: rawData.slice(0, 200) });

        buffer += rawData;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const event = parseStreamLine(line);
          if (event) {
            eventCount++;
            log.debug("Parsed event", { eventCount, type: event.type });

            if (event.type === "stream_event") {
              const innerEvent = event.event as { type?: string; delta?: { type?: string; text?: string } } | undefined;
              if (innerEvent?.type === "content_block_delta" && innerEvent.delta?.type === "text_delta" && innerEvent.delta.text) {
                assistantContent += innerEvent.delta.text;
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } else if (line.trim()) {
            log.warn("Failed to parse line", { line: line.slice(0, 200) });
          }
        }
      });

      child.stderr?.on("data", (data: Buffer) => {
        const stderrData = data.toString();
        log.warn("Received stderr", { data: stderrData });
        const errorEvent = { type: "error", error: stderrData };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
      });

      child.on("close", (code) => {
        log.info("Stream closed", { sessionId, code, eventCount, contentLength: assistantContent.length });

        if (assistantContent) {
          const assistantMessage: Message = {
            id: randomUUID(),
            role: "assistant",
            content: assistantContent,
            timestamp: new Date(),
          };
          messages.get(sessionId)!.push(assistantMessage);
        }

        session.lastActivity = new Date();
        if (code === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        } else {
          log.error("Claude process exited with non-zero code", { code });
        }
        controller.close();
      });

      child.on("error", (err) => {
        log.error("Stream error", { sessionId, error: err.message });
        const errorEvent = { type: "error", error: err.message };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
        controller.close();
      });
    },
  });
}

function createAgentSdkStream(
  sessionId: string,
  connection: AgentSdkConnection,
  session: { lastActivity: Date }
) {
  const encoder = new TextEncoder();
  const sessionMessages = messages.get(sessionId) || [];

  log.info("Creating Agent SDK stream", { sessionId, historyLength: sessionMessages.length });

  const chatHistory: ChatMessage[] = sessionMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return new ReadableStream({
    async start(controller) {
      let assistantContent = "";
      let chunkCount = 0;

      try {
        for await (const text of streamChat(chatHistory, connection.systemPrompt)) {
          chunkCount++;
          assistantContent += text;
          const event = {
            type: "stream_event",
            event: {
              type: "content_block_delta",
              delta: { type: "text_delta", text },
            },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }

        log.info("Agent SDK stream complete", { sessionId, chunkCount, contentLength: assistantContent.length });

        if (assistantContent) {
          const assistantMessage: Message = {
            id: randomUUID(),
            role: "assistant",
            content: assistantContent,
            timestamp: new Date(),
          };
          messages.get(sessionId)!.push(assistantMessage);
        }

        session.lastActivity = new Date();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        log.error("Agent SDK stream error", { sessionId, error: errorMessage });
        const errorEvent = { type: "error", error: errorMessage };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  log.info("POST /api/sessions/:id", { sessionId });

  const session = getSession(sessionId);

  if (!session) {
    log.warn("Session not found", { sessionId });
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await request.json();
  const { prompt } = body;
  log.debug("Request body", { promptLength: prompt?.length });

  if (!prompt) {
    log.warn("Prompt is required");
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

  const connection = getConnectionById(session.connectionId);
  if (!connection) {
    log.warn("Connection not found", { connectionId: session.connectionId });
    return Response.json({ error: "Connection not found" }, { status: 404 });
  }

  log.info("Starting stream", { connectionType: connection.type });

  const userMessage: Message = {
    id: randomUUID(),
    role: "user",
    content: prompt,
    timestamp: new Date(),
  };

  if (!messages.has(sessionId)) {
    messages.set(sessionId, []);
  }
  messages.get(sessionId)!.push(userMessage);

  let stream: ReadableStream;

  if (connection.type === "claude_code_cli") {
    stream = createClaudeCodeStream(sessionId, prompt, connection as ClaudeCodeConnection, session);
  } else if (connection.type === "agent_sdk") {
    stream = createAgentSdkStream(sessionId, connection as AgentSdkConnection, session);
  } else {
    return Response.json({ error: "Unsupported connection type" }, { status: 400 });
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const deleted = deleteSession(sessionId);

  if (!deleted) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
