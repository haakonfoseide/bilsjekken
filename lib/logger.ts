type LogLevel = "log" | "warn" | "error";

type Logger = {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

const callConsole = (level: LogLevel, args: unknown[]) => {
  const fn = console[level] ?? console.log;
  fn(...args);
};

export const logger: Logger = {
  log: (...args: unknown[]) => callConsole("log", args),
  warn: (...args: unknown[]) => callConsole("warn", args),
  error: (...args: unknown[]) => callConsole("error", args),
};

export const log = logger.log;
export const warn = logger.warn;
export const error = logger.error;
