import { getSessionById, getMessages, addMessage, updateSession, getConnectionById, deleteSession } from "@/data/dummy";
import { runClaudeCode } from "@/lib/claude-cli";
import { streamChat, ChatMessage } from "@/lib/anthropic";
import { Message, ClaudeCodeConnection, AgentSdkConnection } from "@/types/project";
import { randomUUID } from "crypto";
import { createLogger } from "@/lib/logger";

const log = createLogger("session-api");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const session = getSessionById(sessionId);

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const sessionMessages = getMessages(sessionId);
  return Response.json({ session, messages: sessionMessages });
}

function createAgentSdkStream(
  sessionId: string,
  connection: AgentSdkConnection
) {
  const encoder = new TextEncoder();
  const sessionMessages = getMessages(sessionId);

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
          addMessage(sessionId, assistantMessage);
        }

        updateSession(sessionId, { lastActivity: new Date() });
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

  const session = getSessionById(sessionId);

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

  log.info("Processing request", { connectionType: connection.type });

  const userMessage: Message = {
    id: randomUUID(),
    role: "user",
    content: prompt,
    timestamp: new Date(),
  };

  addMessage(sessionId, userMessage);

  if (connection.type === "claude_code_cli") {
    try {
      const cliConnection = connection as ClaudeCodeConnection;
      const output = await runClaudeCode(prompt, cliConnection.workingDir);

      const assistantMessage: Message = {
        id: randomUUID(),
        role: "assistant",
        content: output.text,
        timestamp: new Date(),
      };
      addMessage(sessionId, assistantMessage);
      updateSession(sessionId, { lastActivity: new Date() });

      return Response.json({ message: assistantMessage });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      log.error("Claude CLI error", { sessionId, error: errorMessage });
      return Response.json({ error: errorMessage }, { status: 500 });
    }
  } else if (connection.type === "agent_sdk") {
    const stream = createAgentSdkStream(sessionId, connection as AgentSdkConnection);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } else {
    return Response.json({ error: "Unsupported connection type" }, { status: 400 });
  }
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
