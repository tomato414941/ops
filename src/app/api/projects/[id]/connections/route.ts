import { NextResponse } from "next/server";
import { getProjectById, createConnection } from "@/data/dummy";
import { ClaudeCodeConnection, AgentSdkConnection } from "@/types/project";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await request.json();
  const { type, name, workingDir, systemPrompt } = body;

  if (!type || !name) {
    return NextResponse.json(
      { error: "Type and name are required" },
      { status: 400 }
    );
  }

  const project = getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let connectionData: Omit<ClaudeCodeConnection, "id"> | Omit<AgentSdkConnection, "id">;

  if (type === "claude_code_cli") {
    const defaultDir = process.env.HOME || "/tmp";
    connectionData = { type, name, workingDir: workingDir || defaultDir };
  } else if (type === "agent_sdk") {
    connectionData = { type, name, systemPrompt };
  } else {
    return NextResponse.json({ error: "Invalid connection type" }, { status: 400 });
  }

  const connection = createConnection(projectId, connectionData);
  if (!connection) {
    return NextResponse.json({ error: "Failed to create connection" }, { status: 500 });
  }

  return NextResponse.json({ connection }, { status: 201 });
}
