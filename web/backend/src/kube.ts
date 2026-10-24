/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { AppsV1Api, type Cluster, type Context, CoreV1Api, KubeConfig } from "@kubernetes/client-node";

/**
 * Loads the user's kubeconfig (default locations / KUBECONFIG) and hands out
 * typed API clients for a chosen context. The web backend is headless, so it
 * reuses the operator's existing kubeconfig rather than embedding credentials.
 */
export class KubeClients {
  private readonly config = new KubeConfig();

  constructor() {
    this.config.loadFromDefault();
  }

  listContexts(): { contexts: Context[]; currentContext: string } {
    return {
      contexts: this.config.getContexts(),
      currentContext: this.config.getCurrentContext(),
    };
  }

  currentCluster(): Cluster | null {
    return this.config.getCurrentCluster();
  }

  /** Switch the active context (affects subsequently created clients). */
  useContext(name: string): void {
    this.config.setCurrentContext(name);
  }

  /** The underlying KubeConfig, for APIs (e.g. PortForward) that need it. */
  rawConfig(): KubeConfig {
    return this.config;
  }

  core(): CoreV1Api {
    return this.config.makeApiClient(CoreV1Api);
  }

  apps(): AppsV1Api {
    return this.config.makeApiClient(AppsV1Api);
  }
}
