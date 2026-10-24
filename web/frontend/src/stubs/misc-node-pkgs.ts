/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser stubs for assorted Node-only npm packages the full renderer pulls in
// (node-pty, conf, tcp-port-used, selfsigned, ws). Each is exported here under
// its own named export; vite.config aliases the package to the matching export
// via a tiny per-package wrapper. The injectables that use them are faked at
// runtime.

// node-pty — pseudo-terminal, desktop-only.
export const ptySpawn = () => {
  throw new Error("node-pty is not available in the Freelens web build");
};

// conf — persistent config store. Returns an in-memory no-op store.
export class Conf {
  private store = new Map<string, unknown>();
  get(key: string): unknown {
    return this.store.get(key);
  }
  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }
  has(key: string): boolean {
    return this.store.has(key);
  }
  delete(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

// tcp-port-used — port probing, desktop-only.
export const portCheck = async () => false;
export const waitUntilFree = async () => {};
export const waitUntilUsed = async () => {};
export const waitUntilFreeOnHost = async () => {};
export const waitUntilUsedOnHost = async () => {};

// selfsigned — certificate generation, desktop-only.
export const selfsignedGenerate = () => ({ private: "", public: "", cert: "" });
