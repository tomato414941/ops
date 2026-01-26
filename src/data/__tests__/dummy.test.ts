import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getConnectionById,
  createConnection,
  deleteConnection,
  getSessions,
  createSession,
  deleteSession,
  getMessages,
  addMessage,
} from "../dummy";

describe("dummy data", () => {
  let createdProjectId: string;
  let createdConnectionId: string;
  let createdSessionId: string;

  describe("projects CRUD", () => {
    afterEach(() => {
      if (createdProjectId) {
        deleteProject(createdProjectId);
        createdProjectId = "";
      }
    });

    it("should create a project", () => {
      const project = createProject("Test Project", "waiting");
      createdProjectId = project.id;
      expect(project).toBeDefined();
      expect(project.name).toBe("Test Project");
      expect(project.status).toBe("waiting");
      expect(project.connections).toEqual([]);
    });

    it("should get project by id", () => {
      const created = createProject("Get By Id Test");
      createdProjectId = created.id;
      const retrieved = getProjectById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Get By Id Test");
    });

    it("should return undefined for non-existent id", () => {
      const project = getProjectById("non-existent-id");
      expect(project).toBeUndefined();
    });

    it("should update a project", () => {
      const created = createProject("Update Test");
      createdProjectId = created.id;
      const updated = updateProject(created.id, {
        name: "Updated Name",
        status: "action_required",
      });
      expect(updated).toBeDefined();
      expect(updated?.name).toBe("Updated Name");
      expect(updated?.status).toBe("action_required");
    });

    it("should delete a project", () => {
      const created = createProject("Delete Test");
      const result = deleteProject(created.id);
      expect(result).toBe(true);
      expect(getProjectById(created.id)).toBeUndefined();
    });

    it("should return false when deleting non-existent project", () => {
      const result = deleteProject("non-existent-id");
      expect(result).toBe(false);
    });
  });

  describe("connections CRUD", () => {
    beforeEach(() => {
      const project = createProject("Connection Test Project");
      createdProjectId = project.id;
    });

    afterEach(() => {
      if (createdConnectionId) {
        deleteConnection(createdConnectionId);
        createdConnectionId = "";
      }
      if (createdProjectId) {
        deleteProject(createdProjectId);
        createdProjectId = "";
      }
    });

    it("should create a claude_code_cli connection", () => {
      const connection = createConnection(createdProjectId, {
        type: "claude_code_cli",
        name: "CLI Connection",
        workingDir: "/home/test",
      });
      if (connection) createdConnectionId = connection.id;
      expect(connection).toBeDefined();
      expect(connection?.type).toBe("claude_code_cli");
      expect(connection?.name).toBe("CLI Connection");
    });

    it("should create an agent_sdk connection", () => {
      const connection = createConnection(createdProjectId, {
        type: "agent_sdk",
        name: "SDK Connection",
        systemPrompt: "Test prompt",
      });
      if (connection) createdConnectionId = connection.id;
      expect(connection).toBeDefined();
      expect(connection?.type).toBe("agent_sdk");
    });

    it("should get connection by id", () => {
      const created = createConnection(createdProjectId, {
        type: "claude_code_cli",
        name: "Get Test",
        workingDir: "/home/test",
      });
      if (created) createdConnectionId = created.id;
      const retrieved = getConnectionById(created!.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Get Test");
    });

    it("should return undefined for non-existent connection", () => {
      const connection = getConnectionById("non-existent-id");
      expect(connection).toBeUndefined();
    });
  });

  describe("sessions CRUD", () => {
    beforeEach(() => {
      const project = createProject("Session Test Project");
      createdProjectId = project.id;
      const connection = createConnection(createdProjectId, {
        type: "claude_code_cli",
        name: "Session Test Connection",
        workingDir: "/home/test",
      });
      createdConnectionId = connection!.id;
    });

    afterEach(() => {
      if (createdSessionId) {
        deleteSession(createdSessionId);
        createdSessionId = "";
      }
      if (createdConnectionId) {
        deleteConnection(createdConnectionId);
        createdConnectionId = "";
      }
      if (createdProjectId) {
        deleteProject(createdProjectId);
        createdProjectId = "";
      }
    });

    it("should create a session", () => {
      const session = createSession(createdConnectionId);
      createdSessionId = session.id;
      expect(session).toBeDefined();
      expect(session.connectionId).toBe(createdConnectionId);
      expect(session.status).toBe("active");
    });

    it("should get sessions", () => {
      const session = createSession(createdConnectionId);
      createdSessionId = session.id;
      const sessions = getSessions();
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.some((s) => s.id === session.id)).toBe(true);
    });

    it("should delete a session", () => {
      const session = createSession(createdConnectionId);
      const result = deleteSession(session.id);
      expect(result).toBe(true);
    });
  });

  describe("messages", () => {
    beforeEach(() => {
      const project = createProject("Message Test Project");
      createdProjectId = project.id;
      const connection = createConnection(createdProjectId, {
        type: "claude_code_cli",
        name: "Message Test Connection",
        workingDir: "/home/test",
      });
      createdConnectionId = connection!.id;
      const session = createSession(createdConnectionId);
      createdSessionId = session.id;
    });

    afterEach(() => {
      if (createdSessionId) {
        deleteSession(createdSessionId);
        createdSessionId = "";
      }
      if (createdConnectionId) {
        deleteConnection(createdConnectionId);
        createdConnectionId = "";
      }
      if (createdProjectId) {
        deleteProject(createdProjectId);
        createdProjectId = "";
      }
    });

    it("should add and get messages", () => {
      const message = {
        id: "msg-1",
        role: "user" as const,
        content: "Test message",
        timestamp: new Date(),
      };
      addMessage(createdSessionId, message);
      const messages = getMessages(createdSessionId);
      expect(messages).toBeDefined();
      expect(messages.some((m) => m.content === "Test message")).toBe(true);
    });

    it("should return empty array for non-existent session", () => {
      const messages = getMessages("non-existent-session");
      expect(messages).toEqual([]);
    });
  });
});
