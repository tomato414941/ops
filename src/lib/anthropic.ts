import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function* streamChat(
  messages: ChatMessage[],
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
