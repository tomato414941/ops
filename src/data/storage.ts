import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { Project, Session, Message } from "@/types/project";

export interface StorageData {
  projects: Project[];
  sessions: Session[];
  messages: Record<string, Message[]>;
}

const DATA_DIR = join(homedir(), ".ops");
const DATA_FILE = join(DATA_DIR, "data.json");

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadData(): StorageData {
  ensureDir();
  if (!existsSync(DATA_FILE)) {
    return { projects: [], sessions: [], messages: {} };
  }
  try {
    const content = readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return { projects: [], sessions: [], messages: {} };
  }
}

export function saveData(data: StorageData): void {
  ensureDir();
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
