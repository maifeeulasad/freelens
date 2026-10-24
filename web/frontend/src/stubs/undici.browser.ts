/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser stub for undici (Node's HTTP client), aliased in for the full-renderer
// boot. undici reaches deep Node internals (node:diagnostics_channel, workers);
// in a browser the renderer uses the browser fetch injectable instead, so these
// are thin stand-ins. `fetch` delegates to the real browser fetch; the
// dispatcher/agent classes exist only so modules load.

export class Agent {
  constructor(_opts?: unknown) {}
}

export class ProxyAgent {
  constructor(_opts?: unknown) {}
}

export class Pool {}
export class Client {}
export class Dispatcher {}

export const fetch = (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args);

export const getGlobalDispatcher = () => undefined;
export const setGlobalDispatcher = () => {};
export const request = () => {
  throw new Error("undici.request is not available in the Freelens web build");
};

export default {
  Agent,
  ProxyAgent,
  Pool,
  Client,
  Dispatcher,
  fetch,
  getGlobalDispatcher,
  setGlobalDispatcher,
  request,
};
