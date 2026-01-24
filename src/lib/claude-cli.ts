import { spawn, ChildProcess } from "child_process";
import { createLogger } from "./logger";

const log = createLogger("claude-cli");

export interface ClaudeStreamEvent {
  type: string;
  content?: string;
  error?: string;
  [key: string]: unknown;
}

export function runClaudeCode(
  prompt: string,
  workingDir: string,
  sessionId?: string
): ChildProcess {
  const args = ["-p", prompt, "--output-format", "stream-json", "--verbose", "--include-partial-messages"];

  if (sessionId) {
    args.push("-r", sessionId);
  }

  log.debug("Spawning claude process", { args, workingDir, sessionId });

  const child = spawn("claude", args, {
    cwd: workingDir,
    env: { ...process.env },
  });

  child.on("spawn", () => {
    log.debug("Claude process spawned", { pid: child.pid });
  });

  child.on("error", (err) => {
    log.error("Claude process error", { error: err.message });
  });

  child.on("close", (code, signal) => {
    log.debug("Claude process closed", { code, signal });
  });

  return child;
}

export function parseStreamLine(line: string): ClaudeStreamEvent | null {
  if (!line.trim()) return null;
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}
