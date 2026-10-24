/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { createServer, type Server } from "node:net";
import { PortForward } from "@kubernetes/client-node";

import type { KubeClients } from "./kube.ts";

interface ActiveForward {
  id: string;
  namespace: string;
  pod: string;
  podPort: number;
  localPort: number;
  server: Server;
}

/**
 * Opens a local TCP listener that tunnels to a pod port through the
 * Kubernetes API (kubectl-port-forward equivalent). The backend runs on the
 * operator's machine for now, so `localhost:<localPort>` is directly
 * reachable; a future hosted deployment would tunnel this over the browser
 * WebSocket instead.
 */
export class PortForwardManager {
  private readonly forwards = new Map<string, ActiveForward>();
  private readonly kube: KubeClients;

  constructor(kube: KubeClients) {
    this.kube = kube;
  }

  list(): Omit<ActiveForward, "server">[] {
    return [...this.forwards.values()].map(({ server: _server, ...rest }) => rest);
  }

  start(opts: {
    namespace: string;
    pod: string;
    podPort: number;
    localPort?: number;
  }): Promise<Omit<ActiveForward, "server">> {
    const { namespace, pod, podPort } = opts;
    const forward = new PortForward(this.kube.rawConfig());

    const server = createServer((socket) => {
      forward.portForward(namespace, pod, [podPort], socket, null, socket).catch((error: unknown) => {
        socket.destroy(error instanceof Error ? error : undefined);
      });
    });

    return new Promise((resolve, reject) => {
      server.once("error", reject);
      // localPort 0 asks the OS for a free port.
      server.listen(opts.localPort ?? 0, "127.0.0.1", () => {
        const address = server.address();
        const localPort = typeof address === "object" && address ? address.port : 0;
        const id = `${namespace}/${pod}:${podPort}->${localPort}`;
        const entry: ActiveForward = { id, namespace, pod, podPort, localPort, server };
        this.forwards.set(id, entry);
        const { server: _server, ...rest } = entry;
        resolve(rest);
      });
    });
  }

  stop(id: string): boolean {
    const entry = this.forwards.get(id);
    if (!entry) return false;
    entry.server.close();
    this.forwards.delete(id);
    return true;
  }

  stopAll(): void {
    for (const id of [...this.forwards.keys()]) this.stop(id);
  }
}
