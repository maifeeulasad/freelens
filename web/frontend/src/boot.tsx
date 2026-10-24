/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Experiment: boot the REAL Freelens renderer in a plain browser and render its
// real app shell (ReactApplication + its registered children: sidebar, layout,
// routed pages). This uses the app's own getDiForUnitTesting to fully wire the
// renderer DI (every injectable + the fake message bridge + fake-fs overrides),
// which is the closest working full-renderer container, then renders the real
// root component. It is a feasibility probe for "the real UI in the browser",
// separate from the working app at index.html.

import "./node-globals.ts";
import "../../../packages/core/src/renderer/components/app.scss";

import { applicationFeature, startApplicationInjectionToken } from "@freelensapp/application";
import { registerFeature } from "@freelensapp/feature-core";
import { keyboardShortcutsFeature } from "@freelensapp/keyboard-shortcuts";
import { storesAndApisCanBeCreatedInjectionToken } from "@freelensapp/kube-api-specifics";
import {
  enlistMessageChannelListenerInjectionToken,
  requestFromChannelInjectionToken,
  sendMessageToChannelInjectionToken,
} from "@freelensapp/messaging";
import { reactApplicationFeature } from "@freelensapp/react-application";
import { observableHistoryInjectionToken } from "@freelensapp/routing";
import { computed, observable, runInAction } from "mobx";
import appPathsInjectable from "../../../packages/core/src/common/app-paths/app-paths.injectable.ts";
import { Cluster } from "../../../packages/core/src/common/cluster/cluster.ts";
import fetchInjectable from "../../../packages/core/src/common/fetch/fetch.injectable.ts";
import { navigateToUrlInjectionToken } from "../../../packages/core/src/common/front-end-routing/navigate-to-url-injection-token.ts";
import { apiBaseServerAddressInjectionToken } from "../../../packages/core/src/common/k8s-api/api-base-configs.ts";
import productNameInjectable from "../../../packages/core/src/common/vars/product-name.injectable.ts";
import clustersInjectable from "../../../packages/core/src/features/cluster/storage/common/clusters.injectable.ts";
import loadEnabledExtensionsStorageInjectable from "../../../packages/core/src/features/extensions/enabled/renderer/load-storage.injectable.ts";
import selectedNamespacesStorageInjectable from "../../../packages/core/src/features/namespace-filtering/renderer/storage.injectable.ts";
import lensColorThemePreferenceInjectable from "../../../packages/core/src/features/user-preferences/common/lens-color-theme.injectable.ts";
import catalogEntityRegistryInjectable from "../../../packages/core/src/renderer/api/catalog/entity/registry.injectable.ts";
import hostedClusterInjectable from "../../../packages/core/src/renderer/cluster-frame-context/hosted-cluster.injectable.ts";
import hostedClusterIdInjectable from "../../../packages/core/src/renderer/cluster-frame-context/hosted-cluster-id.injectable.ts";
import { getDiForUnitTesting } from "../../../packages/core/src/renderer/getDiForUnitTesting.tsx";
import subscribeStoresInjectable from "../../../packages/core/src/renderer/kube-watch-api/subscribe-stores.injectable.ts";
import { metricsFeature } from "../../../packages/core/src/renderer/library.ts";
import applyLensThemeInjectable from "../../../packages/core/src/renderer/themes/apply-lens-theme.injectable.ts";
import systemThemeConfigurationInjectable from "../../../packages/core/src/renderer/themes/system-theme.injectable.ts";
import createStorageInjectable from "../../../packages/core/src/renderer/utils/create-storage/create-storage.injectable.ts";
import provideInitialValuesForSyncBoxesInjectable from "../../../packages/core/src/renderer/utils/sync-box/provide-initial-values-for-sync-boxes.injectable.ts";
import { createWsIpcRenderer } from "./ws-ipc.ts";

const di = getDiForUnitTesting();

// getDiForUnitTesting prevents side-effect injectables (it is built for tests);
// rendering the real app root needs them, like the production container.
di.permitSideEffects();

// Features the production renderer registers that getDiForUnitTesting omits —
// notably react-application (the react-root) and application (startApplication).
runInAction(() => {
  registerFeature(di, applicationFeature, reactApplicationFeature, keyboardShortcutsFeature, metricsFeature);
});

// The kube-object API talks to this page's own origin, where the backend
// proxies /api-kube. (storesAndApisCanBeCreated is left as the real value: it
// derives from hostedClusterId, so it is false in the root/catalog frame and
// true once a cluster is hosted below.)
di.override(apiBaseServerAddressInjectionToken, () => globalThis.location.origin);

// getDiForUnitTesting global-overrides `fetchInjectable` (id "fetch") with a
// throwing test fake ("Tried to invoke fetch without override"). Restore the
// real browser fetch, exactly as browser-fetch.injectable does in the
// production renderer, so the kube-object stores reach /api-kube.
di.override(fetchInjectable, () => (url, init) => globalThis.fetch(url, init as RequestInit) as never);

// Cluster-frame mode: `?cluster=<id>` renders the real cluster view for that
// cluster. The hosted cluster is normally resolved from the per-cluster iframe's
// host + the main-synced cluster store; here we construct it directly from the
// selected context (a Cluster is just a model). storesAndApisCanBeCreated then
// becomes true and the kube-object stores fetch through /api-kube.
const selectedCluster = new URLSearchParams(globalThis.location.search).get("cluster");
if (selectedCluster) {
  di.override(hostedClusterIdInjectable, () => selectedCluster);
  di.override(
    hostedClusterInjectable,
    () =>
      new Cluster({
        id: selectedCluster,
        contextName: selectedCluster,
        kubeConfigPath: "/virtual/kubeconfig",
        accessibleNamespaces: [],
      }),
  );

  // Resource visibility is driven by the cluster's `resourcesToShow` set, which
  // the Electron main process fills on cluster activation by discovering the
  // apiserver's served resources and filtering them by RBAC. We reproduce the
  // discovery below (after startApplication) by querying the apiserver's own
  // discovery documents through /api-kube and populating `resourcesToShow`, so
  // the sidebar shows exactly the resource types the cluster actually serves —
  // the real `shouldShowResource` injectable is left untouched.
}

// App paths normally arrive from the main process; provide virtual ones.
const virtualAppPaths = {
  currentApp: "/virtual/app",
  home: "/home/user",
  appData: "/virtual/appData",
  userData: "/virtual/userData",
  sessionData: "/virtual/sessionData",
  temp: "/tmp",
  exe: "/virtual/exe",
  module: "/virtual/module",
  desktop: "/virtual/desktop",
  documents: "/virtual/documents",
  downloads: "/virtual/downloads",
  music: "/virtual/music",
  pictures: "/virtual/pictures",
  videos: "/virtual/videos",
  logs: "/virtual/logs",
  crashDumps: "/virtual/crashDumps",
  recent: "/virtual/recent",
};
di.override(appPathsInjectable, () => virtualAppPaths);

// Route the renderer's messaging layer over the WebSocket bridge to the headless
// main in the backend (/ws). These three tokens are the whole messaging surface;
// backing them with the WS ipc is the "httprender" equivalent of Electron IPC.
const wsIpc = createWsIpcRenderer(
  `${globalThis.location.protocol === "https:" ? "wss" : "ws"}://${globalThis.location.host}/ws`,
);
di.override(
  requestFromChannelInjectionToken,
  () => (channel: { id: string }, payload?: unknown) => wsIpc.invoke(channel.id, payload),
);
di.override(
  sendMessageToChannelInjectionToken,
  () => (channel: { id: string }, payload?: unknown) => wsIpc.send(channel.id, payload),
);
di.override(
  enlistMessageChannelListenerInjectionToken,
  () =>
    ({ channel, handler }: { channel: { id: string }; handler: (m: unknown) => void }) => {
      const listener = (_event: unknown, message: unknown) => handler(message);
      wsIpc.on(channel.id, listener);
      return () => wsIpc.off(channel.id, listener);
    },
);

// Sync-box initial values are pushed from main over IPC; without main, skip the
// pull (the boxes keep their defaults) rather than iterating `undefined`.
di.override(provideInitialValuesForSyncBoxesInjectable, () => ({ run: async () => {} }));

// The system theme comes from Electron's nativeTheme; default to dark. It must
// be a settable observable (an init runnable assigns to it), not a computed.
di.override(systemThemeConfigurationInjectable, () => observable.box("dark"));

// Use a fixed theme rather than the system theme, which avoids depending on
// Electron's nativeTheme (the default theme is Lens dark).
di.override(lensColorThemePreferenceInjectable, () =>
  computed(() => ({ useSystemTheme: false, lensThemeId: "lens-dark" })),
);

// getDiForUnitTesting no-ops apply-lens-theme (tests do not paint). Restore the
// real behavior: write every theme color as a `--<name>` CSS custom property on
// <html> and toggle the `theme-light` body flag. Without this the theme CSS
// variables stay empty and the app renders unstyled (black-on-white). This is
// the production injectable's body verbatim.
di.override(applyLensThemeInjectable, () => (theme) => {
  for (const [name, value] of Object.entries(theme.colors)) {
    document.documentElement.style.setProperty(`--${name}`, value as string);
  }
  document.body.classList.toggle("theme-light", theme.type === "light");
});

// The cluster list is synced from main; without it, present an empty list so
// cluster-state broadcasting iterates nothing instead of undefined.
di.override(clustersInjectable, () => computed(() => []));

// subscribeStores normally starts a streaming watch per store; the test
// container no-ops it. In the web app we do a one-shot load instead (fetch
// through /api-kube), which fills the resource pages with live data without the
// long-lived watch connection.
di.override(subscribeStoresInjectable, () => (stores: { loadAll?: () => unknown }[]) => {
  for (const store of stores) void store.loadAll?.();
  return () => {};
});

// Namespace-selection storage normally requires a hosted cluster; provide a
// default-backed storage so the catalog's ClusterManager renders.
di.override(selectedNamespacesStorageInjectable, (dic) =>
  dic.inject(createStorageInjectable)("selected_namespaces", ["default"]),
);

// Branding (product name) comes from the application-information the main
// process supplies; set it directly.
di.override(productNameInjectable, () => "Freelens");

// Extensions loading (a persistent store whose version comes from main) is not
// needed to paint the shell; skip it.
di.override(loadEnabledExtensionsStorageInjectable, () => ({ run: async () => {} }));

// startApplication runs the init runnables (which fill initializable state like
// build-version and app-paths) and then renders the real app into #app, exactly
// like freelens/src/renderer/index.ts. Rendering ReactApplication by hand would
// skip the init phase and hit uninitialized-state errors.
const startApplication = di.inject(startApplicationInjectionToken);

void startApplication();

// Cluster API discovery: populate the hosted cluster's `resourcesToShow` from
// the apiserver's own discovery documents, the web-app stand-in for the
// discovery the Electron main runs on cluster activation. Each served resource
// becomes a `shouldShowResource` key (`<group>/<plural>`, or just `<plural>`
// for the core group — exactly what `formatKubeApiResource` produces), so the
// real sidebar and routes light up only for resource types the cluster serves.
if (selectedCluster) {
  void (async () => {
    const base = `${globalThis.location.origin}/api-kube`;
    const keys = new Set<string>();

    const addResources = (group: string, resources?: { name?: string }[]) => {
      for (const resource of resources ?? []) {
        // Skip subresources (e.g. "pods/status"); only top-level kinds have routes.
        if (!resource.name || resource.name.includes("/")) continue;
        keys.add(group ? `${group}/${resource.name}` : resource.name);
      }
    };

    try {
      // Core group (group === "") lives at /api/v1; named groups are listed at
      // /apis, and each group's preferred version holds its resource list.
      const core = (await fetch(`${base}/api/v1`).then((r) => r.json())) as {
        resources?: { name?: string }[];
      };
      addResources("", core.resources);

      const groups = (await fetch(`${base}/apis`).then((r) => r.json())) as {
        groups?: { name: string; preferredVersion?: { groupVersion?: string } }[];
      };
      await Promise.all(
        (groups.groups ?? []).map(async (group) => {
          const groupVersion = group.preferredVersion?.groupVersion;
          if (!groupVersion) return;
          const doc = (await fetch(`${base}/apis/${groupVersion}`).then((r) => r.json())) as {
            resources?: { name?: string }[];
          };
          addResources(group.name, doc.resources);
        }),
      );

      const cluster = di.inject(hostedClusterInjectable);
      runInAction(() => cluster?.resourcesToShow.replace([...keys]));
    } catch (error) {
      console.error("[freelens-web] cluster API discovery failed", error);
    }
  })();
}

// Expose a client-side navigation helper for the cluster frame (used to open
// resource pages like Pods, which subscribe their kube-object store and fetch
// through /api-kube).
(globalThis as unknown as { freelensGo?: (path: string) => void; freelensDi?: unknown }).freelensGo = (path) => {
  di.inject(navigateToUrlInjectionToken)(path);
};
(globalThis as unknown as { freelensHistory?: unknown }).freelensHistory = di.inject(observableHistoryInjectionToken);

// Phase 3: feed the catalog the real cluster(s) from the backend's kubeconfig,
// so "Browse Clusters in Catalog" lists them. In the Electron app these entities
// are synced from main over IPC; here the backend exposes them over /api.
void (async () => {
  try {
    const { currentContext, contexts } = (await fetch("/api/contexts").then((r) => r.json())) as {
      currentContext?: string;
      contexts?: { name: string }[];
    };
    const names = (contexts ?? []).map((c) => c.name);
    if (names.length === 0) return;

    const registry = di.inject(catalogEntityRegistryInjectable);
    registry.updateItems(
      names.map((name) => ({
        apiVersion: "entity.k8slens.dev/v1alpha1",
        kind: "KubernetesCluster",
        metadata: { uid: name, name, source: "local", labels: {} },
        spec: { kubeconfigPath: "/virtual/kubeconfig", kubeconfigContext: name },
        status: { phase: name === currentContext ? "connected" : "disconnected" },
      })),
    );
  } catch (error) {
    console.error("[freelens-web] failed to populate catalog clusters", error);
  }
})();
