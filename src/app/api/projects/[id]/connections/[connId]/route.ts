import { NextResponse } from "next/server";
import { getConnectionById, updateConnection, deleteConnection } from "@/data/dummy";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; connId: string }> }
) {
  const { connId } = await params;
  const body = await request.json();
  const { name, workingDir, systemPrompt } = body;

  const connection = getConnectionById(connId);
  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const updates: Record<string, string> = {};
  if (name !== undefined) updates.name = name;
  if (workingDir !== undefined) updates.workingDir = workingDir;
  if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;

  const updated = updateConnection(connId, updates);
  if (!updated) {
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
  }

  return NextResponse.json({ connection: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; connId: string }> }
) {
  const { connId } = await params;

  const deleted = deleteConnection(connId);
  if (!deleted) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
