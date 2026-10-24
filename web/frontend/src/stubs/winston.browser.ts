/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
// Browser stub for winston (Node logging, built on streams/fs). The renderer's
// loggers are faked/console-backed; this keeps winston imports from pulling the
// Node stream machinery.
const logger = {
  info: (...a: unknown[]) => console.info(...a),
  error: (...a: unknown[]) => console.error(...a),
  warn: (...a: unknown[]) => console.warn(...a),
  debug: (...a: unknown[]) => console.debug(...a),
  silly: (...a: unknown[]) => console.debug(...a),
  verbose: (...a: unknown[]) => console.debug(...a),
  log: (...a: unknown[]) => console.log(...a),
  add() {
    return logger;
  },
  remove() {
    return logger;
  },
  child() {
    return logger;
  },
  on() {
    return logger;
  },
  configure() {},
};
export function createLogger() {
  return logger;
}
const fmtFn = (..._a: unknown[]) => ({ transform: (info: unknown) => info });
export const format: Record<string, unknown> & ((..._a: unknown[]) => unknown) = new Proxy(fmtFn, {
  get: () => fmtFn,
}) as never;
export const transports = { Console: class {}, File: class {}, Stream: class {}, Http: class {} };
export const addColors = () => {};
export const config = { npm: { levels: {} }, cli: { levels: {} } };
export default { createLogger, format, transports, addColors, config };
