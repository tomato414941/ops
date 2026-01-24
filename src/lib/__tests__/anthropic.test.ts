import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        stream: vi.fn().mockImplementation(() => {
          const events = [
            { type: "content_block_delta", delta: { type: "text_delta", text: "Hello" } },
            { type: "content_block_delta", delta: { type: "text_delta", text: " World" } },
          ];
          return Promise.resolve({
            [Symbol.asyncIterator]: async function* () {
              for (const event of events) {
                yield event;
              }
            },
          });
        }),
      };
    },
  };
});

import { streamChat, ChatMessage } from "../anthropic";

describe("anthropic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("streamChat", () => {
    it("should yield text chunks from the stream", async () => {
      const messages: ChatMessage[] = [{ role: "user", content: "Hi" }];

      const chunks: string[] = [];
      for await (const chunk of streamChat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["Hello", " World"]);
    });

    it("should accept system prompt", async () => {
      const messages: ChatMessage[] = [{ role: "user", content: "Hi" }];

      const chunks: string[] = [];
      for await (const chunk of streamChat(messages, "You are helpful")) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it("should handle empty messages array", async () => {
      const messages: ChatMessage[] = [];

      const chunks: string[] = [];
      for await (const chunk of streamChat(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["Hello", " World"]);
    });
  });
});
