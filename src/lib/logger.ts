type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (level && level in LOG_LEVELS) {
    return level as LogLevel;
  }
  return "info";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getLogLevel()];
}

function formatMessage(level: LogLevel, context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const dataStr = data !== undefined ? ` ${JSON.stringify(data)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}${dataStr}`;
}

export function createLogger(context: string) {
  return {
    debug: (message: string, data?: unknown) => {
      if (shouldLog("debug")) {
        console.log(formatMessage("debug", context, message, data));
      }
    },
    info: (message: string, data?: unknown) => {
      if (shouldLog("info")) {
        console.log(formatMessage("info", context, message, data));
      }
    },
    warn: (message: string, data?: unknown) => {
      if (shouldLog("warn")) {
        console.warn(formatMessage("warn", context, message, data));
      }
    },
    error: (message: string, data?: unknown) => {
      if (shouldLog("error")) {
        console.error(formatMessage("error", context, message, data));
      }
    },
  };
}
