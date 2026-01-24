import { NextResponse } from "next/server";
import { sessions, getConnectionById } from "@/data/dummy";
import { Session } from "@/types/project";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const body = await request.json();
  const { connectionId } = body;

  const connection = getConnectionById(connectionId);
  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const session: Session = {
    id: randomUUID(),
    connectionId,
    status: "active",
    lastActivity: new Date(),
  };

  sessions.push(session);

  return NextResponse.json({ sessionId: session.id });
}

export async function GET() {
  return NextResponse.json({ sessions });
}
