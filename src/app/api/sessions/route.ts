import { NextResponse } from "next/server";
import { getConnectionById, createSession, getSessions } from "@/data/dummy";

export async function POST(request: Request) {
  const body = await request.json();
  const { connectionId } = body;

  const connection = getConnectionById(connectionId);
  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const session = createSession(connectionId);

  return NextResponse.json({ sessionId: session.id });
}

export async function GET() {
  return NextResponse.json({ sessions: getSessions() });
}
