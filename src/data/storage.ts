import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { Project, Session, Message } from "@/types/project";

export interface StorageData {
  projects: Project[];
  sessions: Session[];
  messages: Record<string, Message[]>;
}

function getDataDir(): string {
  if (process.env.OPS_DATA_DIR) {
    return process.env.OPS_DATA_DIR;
  }
  if (process.env.NODE_ENV === "production") {
    return "/data";
  }
  return join(homedir(), ".ops");
}

function getDataFile(): string {
  return join(getDataDir(), "data.json");
}

function ensureDir(): void {
  const dataDir = getDataDir();
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

export function loadData(): StorageData {
  ensureDir();
  const dataFile = getDataFile();
  if (!existsSync(dataFile)) {
    return { projects: [], sessions: [], messages: {} };
  }
  try {
    const content = readFileSync(dataFile, "utf-8");
    return JSON.parse(content);
  } catch {
    return { projects: [], sessions: [], messages: {} };
  }
}

export function saveData(data: StorageData): void {
  ensureDir();
  writeFileSync(getDataFile(), JSON.stringify(data, null, 2));
}
