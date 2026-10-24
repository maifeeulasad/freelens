/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser stub for @kubernetes/client-node in the full-renderer boot. This
// Node client (fs/net/tls) is used by main/common cluster code; in the browser
// the kube-object API talks to /api-kube instead, and these injectables are
// faked at runtime. Only the few value imports the renderer pulls are stubbed.

export class KubeConfig {
  loadFromDefault(): void {}
  loadFromString(): void {}
  loadFromFile(): void {}
  getContexts(): unknown[] {
    return [];
  }
  getClusters(): unknown[] {
    return [];
  }
  getUsers(): unknown[] {
    return [];
  }
  getCurrentContext(): string {
    return "";
  }
  setCurrentContext(): void {}
  getContextObject(): undefined {
    return undefined;
  }
  getCurrentCluster(): null {
    return null;
  }
  makeApiClient<T>(_ctor: new () => T): T {
    return {} as T;
  }
  exportConfig(): string {
    return "{}";
  }
  applyToHTTPSOptions(): void {}
}

export class CoreV1Api {}
export class AuthorizationV1Api {}

export class Watch {
  constructor(_config?: unknown) {}
  watch(): Promise<{ abort: () => void }> {
    return Promise.resolve({ abort: () => {} });
  }
}

export class ApiException extends Error {
  constructor(
    public code = 0,
    message = "ApiException",
    public body: unknown = undefined,
    public headers: unknown = undefined,
  ) {
    super(message);
  }
}

export function dumpYaml(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

export default { KubeConfig, CoreV1Api, AuthorizationV1Api, Watch, ApiException, dumpYaml };
