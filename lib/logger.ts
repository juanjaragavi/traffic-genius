/**
 * TrafficGenius — Pino Logger
 *
 * Structured logging with Pino. Auto-disabled in production
 * unless NEXT_PUBLIC_ENABLE_LOGGING=true.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info({ userId }, "User authenticated");
 */

import pino from "pino";

const isServer = typeof window === "undefined";
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const forceLogging = process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true";

const shouldLog = isDevelopment || isTest || forceLogging;

interface NoOpLogger {
  trace: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  fatal: (...args: unknown[]) => void;
  child: (bindings?: Record<string, unknown>) => NoOpLogger | pino.Logger;
}

const createLogger = (): pino.Logger | NoOpLogger => {
  if (!shouldLog) {
    const noop = () => {};
    return {
      trace: noop,
      debug: noop,
      info: noop,
      warn: noop,
      error: noop,
      fatal: noop,
      child: () => createLogger(),
    };
  }

  if (isServer) {
    return pino({
      level: isDevelopment ? "debug" : "info",
      formatters: {
        level: (label) => ({ level: label }),
      },
    });
  }

  // Client-side: wrap console methods
  const clientLogger: NoOpLogger = {
    trace: (...args: unknown[]) => {},
    debug: (...args: unknown[]) => {},
    info: (...args: unknown[]) => {},
    warn: (...args: unknown[]) => {},
    error: (...args: unknown[]) => {},
    fatal: (...args: unknown[]) => {},
    child: () => createLogger(),
  };

  if (isDevelopment) {
    clientLogger.trace = (...args) =>
      (globalThis as unknown as { console: Console }).console.debug(
        "[TRACE]",
        ...args,
      );
    clientLogger.debug = (...args) =>
      (globalThis as unknown as { console: Console }).console.debug(
        "[DEBUG]",
        ...args,
      );
    clientLogger.info = (...args) =>
      (globalThis as unknown as { console: Console }).console.info(
        "[INFO]",
        ...args,
      );
    clientLogger.warn = (...args) =>
      (globalThis as unknown as { console: Console }).console.warn(
        "[WARN]",
        ...args,
      );
    clientLogger.error = (...args) =>
      (globalThis as unknown as { console: Console }).console.error(
        "[ERROR]",
        ...args,
      );
    clientLogger.fatal = (...args) =>
      (globalThis as unknown as { console: Console }).console.error(
        "[FATAL]",
        ...args,
      );
  }

  return clientLogger;
};

export const logger = createLogger();

/**
 * Create a child logger scoped to a module.
 */
export function createScopedLogger(namespace: string) {
  if ("child" in logger && typeof logger.child === "function") {
    return (logger as pino.Logger).child({ module: namespace });
  }
  return logger;
}
