/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Stand-in for Node builtins that have no browser equivalent (child_process,
// net, tls, dns, ...). In the full-renderer boot, the injectables that would use
// them are overridden with in-memory fakes, so these are never called; the named
// exports below exist only so the modules load and bundle. Anything actually
// invoked throws a clear error.

function unavailable(name: string) {
  return (..._args: unknown[]): never => {
    throw new Error(`Node "${name}" is not available in the Freelens web build`);
  };
}

// child_process
export const spawn = unavailable("child_process.spawn");
export const exec = unavailable("child_process.exec");
export const execFile = unavailable("child_process.execFile");
export const execFileSync = unavailable("child_process.execFileSync");
export const execSync = unavailable("child_process.execSync");
export const fork = unavailable("child_process.fork");

// net / tls
export class Socket {}
export class Server {}
export const createServer = unavailable("net.createServer");
export const createConnection = unavailable("net.createConnection");
export const connect = unavailable("net.connect");
export class TLSSocket {}

// dns
export const lookup = unavailable("dns.lookup");

// zlib
export const createGzip = unavailable("zlib.createGzip");
export const createGunzip = unavailable("zlib.createGunzip");
export const createDeflate = unavailable("zlib.createDeflate");
export const createInflate = unavailable("zlib.createInflate");
export const gzip = unavailable("zlib.gzip");
export const gunzip = unavailable("zlib.gunzip");
export const deflate = unavailable("zlib.deflate");
export const inflate = unavailable("zlib.inflate");
export const gzipSync = unavailable("zlib.gzipSync");
export const gunzipSync = unavailable("zlib.gunzipSync");
export const constants = {};

// http / https
export const request = unavailable("http.request");
export const get = unavailable("http.get");
export class Agent {}
export const globalAgent = {};
export const STATUS_CODES = {};
export const METHODS = [];

// diagnostics_channel
export const channel = (_name: string) => ({
  subscribe: () => {},
  unsubscribe: () => {},
  publish: () => {},
  get hasSubscribers() {
    return false;
  },
});
export const tracingChannel = (_name: string) => ({
  subscribe: () => {},
  unsubscribe: () => {},
});

// worker_threads
export class Worker {}
export const isMainThread = true;
export const parentPort = null;
export const workerData = undefined;

// perf_hooks
export const performance = globalThis.performance;
export class PerformanceObserver {
  observe() {}
  disconnect() {}
}

// async_hooks
export class AsyncLocalStorage {
  getStore() {
    return undefined;
  }
  run<T>(_store: unknown, cb: () => T): T {
    return cb();
  }
}

export default {
  spawn,
  exec,
  execFile,
  execFileSync,
  execSync,
  fork,
  Socket,
  Server,
  createServer,
  createConnection,
  connect,
  TLSSocket,
  lookup,
};
