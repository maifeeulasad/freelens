/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser stub for the node-only `tar` package in the full-renderer boot. Tar
// handling (extension install, binary unpacking) runs in the backend/main, not
// the browser; the injectables that use it are faked at runtime, so these are
// no-ops that keep the modules loading.

const unavailable = (name: string) => () => {
  throw new Error(`tar.${name} is not available in the Freelens web build`);
};

export const list = unavailable("list");
export const extract = unavailable("extract");
export const create = unavailable("create");
export const update = unavailable("update");
export const replace = unavailable("replace");
export const t = list;
export const x = extract;
export const c = create;
export const u = update;
export const r = replace;

export default { list, extract, create, update, replace, t, x, c, u, r };
