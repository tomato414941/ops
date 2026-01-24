import { Project, ClaudeCodeConnection, AgentSdkConnection, Session, Message, Connection } from "@/types/project";

declare global {
  var _projects: Project[] | undefined;
  var _sessions: Session[] | undefined;
  var _messages: Map<string, Message[]> | undefined;
}

const defaultProjects: Project[] = [
  {
    id: "1",
    name: "ops",
    status: "action_required",
    connections: [
      {
        id: "conn-1",
        type: "claude_code_cli",
        name: "ops開発",
        workingDir: "/home/dev/projects/ops",
      } as ClaudeCodeConnection,
    ],
  },
  {
    id: "2",
    name: "slack監視",
    status: "waiting",
    connections: [
      {
        id: "conn-2",
        type: "claude_code_cli",
        name: "slack-monitor開発",
        workingDir: "/home/dev/projects/slack-monitor",
      } as ClaudeCodeConnection,
    ],
  },
  {
    id: "3",
    name: "新規企画",
    status: "action_required",
    connections: [
      {
        id: "conn-3",
        type: "agent_sdk",
        name: "企画アシスタント",
        systemPrompt: "あなたは企画立案を支援するアシスタントです。",
      } as AgentSdkConnection,
    ],
  },
];

if (!global._projects) {
  global._projects = [...defaultProjects];
}
if (!global._sessions) {
  global._sessions = [];
}
if (!global._messages) {
  global._messages = new Map();
}

export const projects: Project[] = global._projects;
export const sessions: Session[] = global._sessions;
export const messages: Map<string, Message[]> = global._messages;

// Project CRUD
export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function createProject(name: string, status: "action_required" | "waiting" = "waiting"): Project {
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    status,
    connections: [],
  };
  projects.push(project);
  return project;
}

export function updateProject(id: string, updates: Partial<Pick<Project, "name" | "status">>): Project | undefined {
  const project = getProjectById(id);
  if (!project) return undefined;
  if (updates.name !== undefined) project.name = updates.name;
  if (updates.status !== undefined) project.status = updates.status;
  return project;
}

export function deleteProject(id: string): boolean {
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return false;
  projects.splice(index, 1);
  return true;
}

// Connection CRUD
export function getConnectionById(connectionId: string): Connection | undefined {
  for (const project of projects) {
    const conn = project.connections.find((c) => c.id === connectionId);
    if (conn) {
      return conn;
    }
  }
  return undefined;
}

export function createConnection(
  projectId: string,
  connection: Omit<ClaudeCodeConnection, "id"> | Omit<AgentSdkConnection, "id">
): Connection | undefined {
  const project = getProjectById(projectId);
  if (!project) return undefined;
  const newConnection = {
    ...connection,
    id: crypto.randomUUID(),
  } as Connection;
  project.connections.push(newConnection);
  return newConnection;
}

export function updateConnection(
  connectionId: string,
  updates: Partial<Omit<Connection, "id" | "type">>
): Connection | undefined {
  for (const project of projects) {
    const conn = project.connections.find((c) => c.id === connectionId);
    if (conn) {
      Object.assign(conn, updates);
      return conn;
    }
  }
  return undefined;
}

export function deleteConnection(connectionId: string): boolean {
  for (const project of projects) {
    const index = project.connections.findIndex((c) => c.id === connectionId);
    if (index !== -1) {
      project.connections.splice(index, 1);
      return true;
    }
  }
  return false;
}

// Session CRUD
export function getSessionById(id: string): Session | undefined {
  return sessions.find((s) => s.id === id);
}

export function deleteSession(id: string): boolean {
  const index = sessions.findIndex((s) => s.id === id);
  if (index === -1) return false;
  sessions.splice(index, 1);
  messages.delete(id);
  return true;
}
