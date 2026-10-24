/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
// Browser node:timers: setImmediate via setTimeout(0); the rest delegate to the
// browser globals.
export const setImmediate = (fn: (...a: unknown[]) => void, ...args: unknown[]) =>
  globalThis.setTimeout(fn, 0, ...args);
export const clearImmediate = (id: unknown) => globalThis.clearTimeout(id as number);
export const setTimeout = (fn: (...a: unknown[]) => void, ms?: number, ...args: unknown[]) =>
  globalThis.setTimeout(fn, ms, ...args);
export const clearTimeout = (id: unknown) => globalThis.clearTimeout(id as number);
export const setInterval = (fn: (...a: unknown[]) => void, ms?: number, ...args: unknown[]) =>
  globalThis.setInterval(fn, ms, ...args);
export const clearInterval = (id: unknown) => globalThis.clearInterval(id as number);
export default { setImmediate, clearImmediate, setTimeout, clearTimeout, setInterval, clearInterval };
