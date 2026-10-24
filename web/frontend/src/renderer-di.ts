/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// A *scoped* Freelens renderer DI container: enough of the real renderer's
// dependency-injection graph to mount real core components (the table) AND to
// create a real kube-object API (podApi) that fetches through the backend's
// /api-kube proxy. It follows the app's getDiForUnitTesting pattern
// (createContainer("renderer") + registerMobX + registerFeature + glob) but
// limits the glob to the browser-clean subtrees these need, and provides a few
// browser seams where the real renderer assumes Electron/Node:
//
//   - apiBaseServerAddress  -> this page's own origin (http on 127.0.0.1),
//     instead of the renderer's https://<cluster>.renderer.freelens.app
//   - storesAndApisCanBeCreated -> true (no hosted-cluster frame here)
//   - winston logger / node:assert / file-based storage init -> handled in
//     vite.config.ts and by excluding initialize-state
//
// The full renderer adds the kube-object *stores* (watch + cluster-frame
// context) on top of exactly this.

import { registerFeature } from "@freelensapp/feature-core";
import { kubeApiSpecificsFeature } from "@freelensapp/kube-api-specifics";
import { loggerFeature } from "@freelensapp/logger";
import { notificationsFeature } from "@freelensapp/notifications";
import { routingFeature } from "@freelensapp/routing";
import { createContainer, type DiContainer, type Injectable, isInjectable } from "@ogre-tools/injectable";
import { registerMobX } from "@ogre-tools/injectable-extension-for-mobx";
import { runInAction } from "mobx";
import { registerWebPlatform } from "./web-platform.ts";

// Eagerly load the injectables of the table + kube-api closures. Every listed
// subtree is free of runtime node:/electron imports except node:assert (Vite
// alias) and a couple of files excluded by negation below.
const injectableModules = import.meta.glob<{ default?: unknown }>(
  [
    // table component + its storage/navigation infra
    "../../../packages/core/src/renderer/components/table/**/*.injectable.{ts,tsx}",
    "../../../packages/core/src/renderer/navigation/create-page-param.injectable.ts",
    "../../../packages/core/src/renderer/utils/create-storage/**/*.injectable.{ts,tsx}",
    "!../../../packages/core/src/renderer/utils/create-storage/initialize-state.injectable.ts",
    "../../../packages/core/src/renderer/utils/create-storage-helper.injectable.ts",
    // kube-api layer: apiKube + the JSON API + fetch, talking to /api-kube
    "../../../packages/core/src/common/k8s-api/**/*.injectable.{ts,tsx}",
    "../../../packages/core/src/common/fetch/**/*.injectable.{ts,tsx}",
    "../../../packages/core/src/common/vars/is-development.injectable.ts",
    "../../../packages/core/src/common/vars/is-production.injectable.ts",
    "../../../packages/core/src/renderer/fetch/**/*.injectable.{ts,tsx}",
    "../../../packages/core/src/renderer/k8s/**/*.injectable.{ts,tsx}",
    // provided as a browser seam below instead:
    "!../../../packages/core/src/renderer/k8s/api-base-server-address.injectable.ts",
  ],
  { eager: true },
);

let container: DiContainer | undefined;

/** Build (once) the scoped renderer DI container. */
export function getRendererDi(): DiContainer {
  if (container) return container;

  const di = createContainer("renderer");

  di.permitSideEffects();
  registerMobX(di);

  runInAction(() => {
    registerFeature(di, loggerFeature, routingFeature, notificationsFeature, kubeApiSpecificsFeature);

    for (const mod of Object.values(injectableModules)) {
      const injectable = mod.default;
      if (isInjectable(injectable)) {
        di.register(injectable as Injectable<unknown, unknown, unknown>);
      }
    }

    // Browser values for the renderer's environment tokens, registered after
    // the glob so they are the sole provider of their single-injection tokens.
    registerWebPlatform(di);
  });

  container = di;
  return di;
}
