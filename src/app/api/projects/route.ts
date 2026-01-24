import { NextResponse } from "next/server";
import { projects, createProject } from "@/data/dummy";

export async function GET() {
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, status } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const project = createProject(name, status);
  return NextResponse.json({ project }, { status: 201 });
}
