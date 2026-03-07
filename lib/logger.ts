type LogLevel = "INFO" | "WARN" | "ERROR";

function formatMeta(meta?: unknown): string {
  if (meta === undefined) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [unserializable-meta]";
  }
}

function log(level: LogLevel, scope: string, message: string, meta?: unknown) {
  const line = `[${new Date().toISOString()}] [${level}] [${scope}] ${message}${formatMeta(meta)}`;

  if (level === "ERROR") {
    console.error(line);
    return;
  }

  if (level === "WARN") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(scope: string, message: string, meta?: unknown) {
  log("INFO", scope, message, meta);
}

export function logWarn(scope: string, message: string, meta?: unknown) {
  log("WARN", scope, message, meta);
}

export function logError(scope: string, message: string, meta?: unknown) {
  log("ERROR", scope, message, meta);
}