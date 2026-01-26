import { spawn } from "child_process";
import { createLogger } from "./logger";

const log = createLogger("claude-cli");

export type CliOutput = {
  text: string;
  sessionId?: string;
};

export function parseStreamLine(line: string): Record<string, unknown> | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

type SpawnResult = {
  stdout: string;
  stderr: string;
  code: number | null;
};

async function runClaudeCommand(
  args: string[],
  options: { timeoutMs: number; cwd: string }
): Promise<SpawnResult> {
  const { timeoutMs, cwd } = options;

  return new Promise((resolve, reject) => {
    const child = spawn("claude", args, {
      stdio: ["ignore", "pipe", "pipe"],
      cwd,
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
  });
}

function parseCliJson(raw: string): CliOutput | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return {
      text: parsed.result || "",
      sessionId: parsed.session_id,
    };
  } catch {
    return null;
  }
}

export async function runClaudeCode(
  prompt: string,
  workingDir: string,
  options?: { timeoutMs?: number; sessionId?: string }
): Promise<CliOutput> {
  const timeoutMs = options?.timeoutMs ?? 300_000;
  const args = ["-p", prompt, "--output-format", "json"];

  if (options?.sessionId) {
    args.push("--session-id", options.sessionId);
  }

  log.info("Running claude command", { workingDir });

  const result = await runClaudeCommand(args, { timeoutMs, cwd: workingDir });

  if (result.code !== 0) {
    const err = result.stderr || result.stdout || "CLI failed";
    log.error("Claude CLI failed", { code: result.code, error: err });
    throw new Error(err);
  }

  const output = parseCliJson(result.stdout);
  if (!output) {
    throw new Error("Failed to parse CLI output");
  }

  return output;
}
