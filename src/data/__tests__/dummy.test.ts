import { describe, it, expect } from "vitest";
import { projects, sessions, messages, getProjectById, getConnectionById } from "../dummy";

describe("dummy data", () => {
  describe("projects", () => {
    it("should have predefined projects", () => {
      expect(projects.length).toBeGreaterThan(0);
    });

    it("should have ops project", () => {
      const ops = projects.find((p) => p.name === "ops");
      expect(ops).toBeDefined();
      expect(ops?.status).toBe("action_required");
    });

    it("should have project with agent_sdk connection", () => {
      const project = projects.find((p) =>
        p.connections.some((c) => c.type === "agent_sdk")
      );
      expect(project).toBeDefined();
      expect(project?.name).toBe("新規企画");
    });
  });

  describe("getProjectById", () => {
    it("should return project by id", () => {
      const project = getProjectById("1");
      expect(project).toBeDefined();
      expect(project?.name).toBe("ops");
    });

    it("should return undefined for non-existent id", () => {
      const project = getProjectById("non-existent");
      expect(project).toBeUndefined();
    });
  });

  describe("getConnectionById", () => {
    it("should return claude_code_cli connection", () => {
      const connection = getConnectionById("conn-1");
      expect(connection).toBeDefined();
      expect(connection?.type).toBe("claude_code_cli");
      expect(connection?.name).toBe("ops開発");
    });

    it("should return agent_sdk connection", () => {
      const connection = getConnectionById("conn-3");
      expect(connection).toBeDefined();
      expect(connection?.type).toBe("agent_sdk");
      expect(connection?.name).toBe("企画アシスタント");
    });

    it("should return undefined for non-existent id", () => {
      const connection = getConnectionById("non-existent");
      expect(connection).toBeUndefined();
    });
  });

  describe("sessions", () => {
    it("should be an array", () => {
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe("messages", () => {
    it("should be a Map", () => {
      expect(messages instanceof Map).toBe(true);
    });
  });
});
