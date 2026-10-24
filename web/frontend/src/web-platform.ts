/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// The web "platform layer": a single place that teaches a renderer DI container
// to behave as a plain-browser environment. The Electron app wires these same
// injection tokens from its main/renderer bootstrap (node-env, api-base
// address, ...) and from Node-only features; here they are provided with
// browser values instead. Keeping them together is the systematic seam — when
// pulling in more of the renderer surfaces another environment token, it gets a
// browser value here rather than another ad-hoc shim.

import { storesAndApisCanBeCreatedInjectionToken } from "@freelensapp/kube-api-specifics";
import { type DiContainer, getInjectable } from "@ogre-tools/injectable";
import { apiBaseServerAddressInjectionToken } from "../../../packages/core/src/common/k8s-api/api-base-configs.ts";
import { nodeEnvInjectionToken } from "../../../packages/core/src/common/vars/node-env-injection-token.ts";

// Mirrors freelens/src/renderer/node-env.injectable.ts, but reads Vite's env
// rather than Node's `process`.
const nodeEnvInjectable = getInjectable({
  id: "web-node-env",
  instantiate: () => (import.meta.env.DEV ? "development" : "production"),
  injectionToken: nodeEnvInjectionToken,
});

// The kube-object API talks to this page's own origin, where the backend's
// /api-kube proxy lives (the renderer uses https://<cluster-frame-host>).
const apiBaseServerAddressInjectable = getInjectable({
  id: "web-api-base-server-address",
  instantiate: () => globalThis.location.origin,
  injectionToken: apiBaseServerAddressInjectionToken,
});

// The real renderer derives this from a hosted-cluster id inside a cluster
// frame; the web app has no frame, but the backend proxy does have a current
// cluster, so APIs and stores may be created.
const storesAndApisCanBeCreatedInjectable = getInjectable({
  id: "web-stores-and-apis-can-be-created",
  instantiate: () => true,
  injectionToken: storesAndApisCanBeCreatedInjectionToken,
});

/**
 * Register the browser values for the environment tokens the renderer expects.
 * Call after globbing the renderer injectables so these are the sole provider
 * of their single-injection tokens (the Node providers are excluded from the
 * glob).
 */
export function registerWebPlatform(di: DiContainer): void {
  di.register(nodeEnvInjectable, apiBaseServerAddressInjectable, storesAndApisCanBeCreatedInjectable);
}
