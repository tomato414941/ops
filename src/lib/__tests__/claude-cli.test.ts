import { describe, it, expect } from "vitest";
import { parseStreamLine } from "../claude-cli";

describe("claude-cli", () => {
  describe("parseStreamLine", () => {
    it("should parse valid JSON line", () => {
      const line = '{"type":"stream_event","event":{"type":"content_block_delta"}}';
      const result = parseStreamLine(line);
      expect(result).toEqual({
        type: "stream_event",
        event: { type: "content_block_delta" },
      });
    });

    it("should return null for empty line", () => {
      expect(parseStreamLine("")).toBeNull();
      expect(parseStreamLine("   ")).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      expect(parseStreamLine("not json")).toBeNull();
      expect(parseStreamLine("{invalid}")).toBeNull();
    });

    it("should parse system init event", () => {
      const line = '{"type":"system","subtype":"init","cwd":"/home/dev"}';
      const result = parseStreamLine(line);
      expect(result).toEqual({
        type: "system",
        subtype: "init",
        cwd: "/home/dev",
      });
    });

    it("should parse content_block_delta event", () => {
      const line = '{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}}';
      const result = parseStreamLine(line);
      expect(result?.type).toBe("stream_event");
      const event = result as { type: string; event: { delta: { text: string } } };
      expect(event.event.delta.text).toBe("Hello");
    });
  });
});
