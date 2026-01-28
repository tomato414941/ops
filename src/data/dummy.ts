import { mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { Project, ClaudeCodeConnection, AgentSdkConnection, Session, Message, Connection } from "@/types/project";
import { loadData, saveData, StorageData } from "./storage";

declare global {
  var _storageData: StorageData | undefined;
}

function getData(): StorageData {
  if (!global._storageData) {
    global._storageData = loadData();
  }
  return global._storageData;
}

function persistData(): void {
  if (global._storageData) {
    saveData(global._storageData);
  }
}

// Project CRUD
export function getProjectById(id: string): Project | undefined {
  return getData().projects.find((p) => p.id === id);
}

export function getProjects(): Project[] {
  return getData().projects;
}

export function createProject(name: string, status: "action_required" | "waiting" = "waiting"): Project {
  const data = getData();
  const id = crypto.randomUUID();
  const path = join(homedir(), ".ops", "projects", id);

  mkdirSync(path, { recursive: true });

  const project: Project = {
    id,
    name,
    path,
    status,
    connections: [],
  };
  data.projects.push(project);
  persistData();
  return project;
}

export function updateProject(id: string, updates: Partial<Pick<Project, "name" | "status">>): Project | undefined {
  const project = getProjectById(id);
  if (!project) return undefined;
  if (updates.name !== undefined) project.name = updates.name;
  if (updates.status !== undefined) project.status = updates.status;
  persistData();
  return project;
}

export function deleteProject(id: string): boolean {
  const data = getData();
  const index = data.projects.findIndex((p) => p.id === id);
  if (index === -1) return false;
  data.projects.splice(index, 1);
  persistData();
  return true;
}

// Connection CRUD
export function getConnectionById(connectionId: string): Connection | undefined {
  const data = getData();
  for (const project of data.projects) {
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
  persistData();
  return newConnection;
}

export function updateConnection(
  connectionId: string,
  updates: Partial<Omit<Connection, "id" | "type">>
): Connection | undefined {
  const data = getData();
  for (const project of data.projects) {
    const conn = project.connections.find((c) => c.id === connectionId);
    if (conn) {
      Object.assign(conn, updates);
      persistData();
      return conn;
    }
  }
  return undefined;
}

export function deleteConnection(connectionId: string): boolean {
  const data = getData();
  for (const project of data.projects) {
    const index = project.connections.findIndex((c) => c.id === connectionId);
    if (index !== -1) {
      project.connections.splice(index, 1);
      persistData();
      return true;
    }
  }
  return false;
}

// Session CRUD
export function getSessionById(id: string): Session | undefined {
  return getData().sessions.find((s) => s.id === id);
}

export function getSessions(): Session[] {
  return getData().sessions;
}

export function createSession(connectionId: string): Session {
  const data = getData();
  const session: Session = {
    id: crypto.randomUUID(),
    connectionId,
    status: "active",
    lastActivity: new Date(),
  };
  data.sessions.push(session);
  persistData();
  return session;
}

export function updateSession(id: string, updates: Partial<Session>): Session | undefined {
  const data = getData();
  const session = data.sessions.find((s) => s.id === id);
  if (!session) return undefined;
  Object.assign(session, updates);
  persistData();
  return session;
}

export function deleteSession(id: string): boolean {
  const data = getData();
  const index = data.sessions.findIndex((s) => s.id === id);
  if (index === -1) return false;
  data.sessions.splice(index, 1);
  delete data.messages[id];
  persistData();
  return true;
}

// Message CRUD
export function getMessages(sessionId: string): Message[] {
  return getData().messages[sessionId] || [];
}

export function addMessage(sessionId: string, message: Message): void {
  const data = getData();
  if (!data.messages[sessionId]) {
    data.messages[sessionId] = [];
  }
  data.messages[sessionId].push(message);
  persistData();
}

