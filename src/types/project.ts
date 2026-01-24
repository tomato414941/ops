export type ProjectStatus = "action_required" | "waiting";

export type ConnectionType = "claude_code_cli" | "agent_sdk";

export interface Connection {
  id: string;
  type: ConnectionType;
  name: string;
}

export interface ClaudeCodeConnection extends Connection {
  type: "claude_code_cli";
  workingDir: string;
}

export interface AgentSdkConnection extends Connection {
  type: "agent_sdk";
  systemPrompt?: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  connections: Connection[];
}

export type SessionStatus = "active" | "completed";

export interface Session {
  id: string;
  connectionId: string;
  status: SessionStatus;
  lastActivity: Date;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
