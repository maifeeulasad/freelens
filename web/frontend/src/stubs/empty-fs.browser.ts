/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser stub for Node filesystem modules (node:fs, node:fs/promises,
// graceful-fs, fs-extra) in the full-renderer boot experiment. The renderer's
// fs-using injectables are overridden with in-memory fakes by
// getDiForUnitTesting, so the real filesystem is never touched; these are
// no-ops that keep the modules loading, and throw if something unexpectedly
// calls them directly.

const fail = (name: string) => {
  throw new Error(`fs.${name} is not available in the Freelens web build`);
};

const handler: ProxyHandler<Record<string, unknown>> = {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    if (prop === "promises") return fsProxy;
    if (prop === "default" || prop === "__esModule") return undefined;
    // Return a throwing function for any fs method accessed but not called.
    return (..._args: unknown[]) => fail(prop);
  },
};

const base: Record<string, unknown> = {
  existsSync: () => false,
  readFileSync: () => fail("readFileSync"),
  constants: {},
};

const fsProxy = new Proxy(base, handler);

export default fsProxy;
export const promises = fsProxy;
export const existsSync = () => false;
export const constants = {};
