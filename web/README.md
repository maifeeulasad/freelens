# Freelens Web — trackable plan

Turning Freelens (an Electron desktop Kubernetes IDE) into a **pure web
application**. This directory holds the web effort and this README is the
living checklist. Work happens on branch `containerized-webui-maifee`.

> Status key: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

## Goal

A browser-served app, backed by a headless Node server, that talks to a
Kubernetes cluster. The first concrete milestone the whole thing is steered
toward:

1. **Deploy** a container / workload into a cluster from the browser.
2. **Expose** it — via a Service and/or **port-forward** — and reach it.

"Start small, go big": ship a thin end-to-end vertical slice against the real
cluster first, then progressively fold in Freelens's real UI and architecture.

## Why this is non-trivial (findings)

- Freelens already runs an HTTP server in its **main** process
  (`packages/core/src/main/freelens-proxy/`, the former LensProxy) that proxies
  browser requests to the kube-apiserver. This is the seed of a web backend.
- The **renderer** is a React app but tightly coupled to Electron: Node
  integration in the renderer, IPC over Electron's `ipcRenderer`/`ipcMain`, and
  `BrowserWindow` (dozens of files in `packages/core` import `electron`). A
  faithful full-renderer port is the big, hard phase.
- `@kubernetes/client-node` is already a workspace dependency — a backend can
  talk to the cluster directly without shelling out, where we want to.
- The **v2 extension system** (`packages/extensions`, `docs/extensions/`) is a
  clean, documented surface (Common / Main / Renderer namespaces exposed via a
  runtime global). It does not itself make the app web, but it is the right
  *pattern* to model a decoupled deploy/expose feature on, and its proxy/kube
  plumbing (contracts C12 HTTP, C15 host kubectl/helm) is reusable study.

## Architecture (target)

```
browser (static React/Vite bundle)
      |  HTTP + WebSocket
      v
Node backend (headless, no Electron)
      |  @kubernetes/client-node  +  kubectl/helm (optional)
      v
Kubernetes cluster (minikube / any kubeconfig context)
```

## Conventions

- New code lives under `web/` as its own pnpm workspace package(s); the
  Electron build is left untouched until a phase explicitly migrates it.
- Reference repos cloned for study go in a **gitignored** `.study/` dir — never
  committed.
- Mini commits, co-authored. No push / no MR until asked.
- Copyright header: new files get the single-line Freelens-only variant
  (see root `AGENTS.md`).

## Phases

### Phase 0 — Discovery & plan `[x]`
- [x] Map Electron/main vs renderer boundary
- [x] Confirm cluster tooling (docker, kubectl, minikube) available
- [x] Write this trackable plan

### Phase 1 — Headless backend vertical slice `[x]`
Minimal dependency-light Node (`node:http`) server using `@kubernetes/client-node`.
- [x] Scaffold `web/backend` workspace package (TS, run via Node type-stripping)
- [x] Load kubeconfig; list contexts; pick current context
- [x] `GET /api/contexts`, `GET /api/namespaces`
- [x] `GET /api/:ns/deployments`, `/pods`, `/services` (read path)
- [x] Health check + wired to a live minikube cluster (profile `freelens-web`)

### Phase 2 — Deploy a container `[x]`
- [x] `POST /api/:ns/deploy` → create a Deployment from {image, name, port, replicas, env}
- [x] Report rollout status (`GET /api/:ns/deployments/:name/status`)
- [x] Delete a deployment (`DELETE /api/:ns/deployments/:name`)

### Phase 3 — Expose `[x]`
- [x] `POST /api/:ns/expose` → create a Service (ClusterIP / NodePort)
- [x] Port-forward: `POST /api/portforwards` via a local TCP tunnel (kube API)
- [x] Surface the reachable local port back to the caller; list/stop forwards
- [ ] (later) tunnel the forward over the browser WebSocket for hosted deploys

### Phase 4 — Web frontend `[x]`
Vite + React 19 app in `web/frontend`, reusing Freelens's real design tokens.
- [x] Scaffold `web/frontend` (Vite + React)
- [x] Reuse Freelens theme tokens (`theme.scss`) + the real `button.scss`
- [x] Cluster/namespace picker (switches kube context live)
- [x] Deploy form (image, name, port, replicas)
- [x] Workload list with status (deployments, pods) + auto-refresh
- [x] Expose / port-forward controls + reachable link
- [x] End-to-end demo against minikube — verified in-browser (deploy, expose,
      port-forward, and the hello-web deploy driven from the UI form)

### Phase 5 — Fold in Freelens proper (go big) `[~]`
Done — a genuinely deployable **pure web app**, no Electron:
- [x] Backend serves the built frontend as static files on one origin
      (`web/backend/src/static.ts`), so prod is a single Node process
- [x] Node-in-browser foundation started: `vite-plugin-node-polyfills` wired in,
      so Freelens packages that import `node:` builtins can begin to load
- [x] Reuse model proven: real theme tokens + real `button.scss` render
      unchanged in a plain browser

Reuse of real shared components — **proven**:
- [x] Split `@freelensapp/utilities` into a browser-safe barrel (`browser.ts`)
      beside the untouched Node barrel (`index.ts`). Only three modules were
      runtime-Node — `base64` (reimplemented with Web APIs),
      `tar` and `union-env-path` (browser stubs); `type-narrowing`'s `node:http`
      import is type-only and already erased. The web build aliases
      `@freelensapp/utilities` → `browser.ts`; the Electron app is unaffected.
- [x] Reuse Freelens's own `standardDecorators()` Vite plugin (TC39 decorators
      for MobX 7 / mobx-react 10) in the web build — the real `@freelensapp/button`
      (with `withTooltip`, mobx `@observer`/`@observable accessor`) now renders
      unchanged in a plain browser (dev + prod), driving the live cluster.

Reuse of a real core data component (next layer — the DI container) — **proven**:
- [x] Mounted Freelens's real `SortableTable` from `@freelensapp/core` in a
      plain browser, rendering live pod data from the backend, with working
      click-to-sort — see `web/frontend/src/WorkloadTable.tsx`.
- [x] Built a **scoped renderer DI container** (`web/frontend/src/renderer-di.ts`):
      `createContainer("renderer")` + `registerMobX` + `registerFeature`
      (routing, logger) + an `import.meta.glob` limited to the table's
      browser-clean closure (table + create-page-param + storage), the same
      shape as the app's `getDiForUnitTesting` without the whole renderer.
- [x] Three small browser/Node seams found and handled, each the general
      pattern for the rest of the renderer:
      - `node:assert` → a tiny shim (Vite alias)
      - `@freelensapp/logger`'s winston logger (Node: util/os/process, and
        `run-many`'s `node:events`) → a console-backed stub (Vite resolveId)
      - excluded `initialize-state` (reads the store from disk via
        app-paths → fs-extra); the browser uses empty in-memory state
- [x] Decorator lowering (the `standardDecorators()` plugin) already covered
      the mobx `@observable accessor` state inside the table's components.

Reuse of the real kube-object API + apiserver proxy — **proven**:
- [x] Backend `/api-kube/*` proxy (`web/backend/src/api-kube-proxy.ts`) forwards
      to the current cluster's apiserver using the kubeconfig's TLS + auth
      (`KubeConfig.applyToHTTPSOptions`) — the headless equivalent of
      `freelens-proxy`. Verified: `GET /api-kube/api/v1/namespaces/default/pods`
      returns the live PodList.
- [x] The table is now fed by Freelens's real `PodApi` (a kube-object `KubeApi`)
      instead of custom backend JSON: it fetches `GET /api-kube/...` from the
      page origin, the backend proxies it, and the rows are real parsed `Pod`
      kube-objects (`getStatus()`, `getNodeName()`, `getRestartsCount()`).
- [x] Consolidated the browser seams into one **web-platform layer**
      (`web/frontend/src/web-platform.ts`): the environment tokens the renderer
      gets from its Electron bootstrap (`node-env`, api-base address,
      stores-can-be-created) are provided browser values in a single place — the
      systematic seam, so each new gap is one line here, not another ad-hoc fix.
- [x] Browser seams for `node:querystring` and `node:events` (shims), browser
      `fetch` + no-op proxy dispatcher reused from the renderer's own injectables.

Phase 1 of the full-renderer transplant — **Node-compat layer, done**:
- [x] The real Freelens renderer now **bundles and boots in a plain browser**.
      The whole renderer DI is wired via the app's own `getDiForUnitTesting`
      (`web/frontend/src/boot.tsx`, served at `/boot.html`), React mounts, and it
      renders the real app shell down to the **cluster frame**.
- [x] A complete **Node-compat seam layer** (`web/frontend/vite.config.ts` +
      `src/stubs/*`): every `node:` builtin and Node-only npm package the full
      renderer statically imports is aliased, in both `node:` and bare forms, to
      a real browser polyfill (memfs for fs, path/stream/util/url/buffer shims)
      or a faked no-op stub (electron, winston, undici, tar, chokidar, conf,
      node-pty, tcp-port-used, selfsigned, ws, @kubernetes/client-node,
      child_process/net/tls/...). `src/node-globals.ts` sets `process`/`Buffer`/
      `setImmediate` and seeds memfs. The code behind the stubs is faked at
      runtime by `getDiForUnitTesting`, so the stubs only need to load.
- [x] Only 6 electron symbols and ~20 Node packages were involved — bounded,
      as predicted. The working app at `/` (real table + PodApi) is unaffected.

Phase 2 — **the real Freelens UI paints in a plain browser**:
- [x] The real renderer now renders its real **root frame**: the Freelens
      **Welcome screen** (logo, "Welcome to Freelens!", auto-detect-clusters
      copy, "Browse Clusters in Catalog", "Open a Terminal") and the **catalog
      sidebar** — all the actual Freelens components, in a plain browser.
- [x] Frame selection fixed: `process.isMainFrame` (an Electron property absent
      in the browser) is set true in `node-globals.ts`, so the renderer picks the
      root frame instead of a per-cluster iframe.
- [x] `startApplication()` runs the real init runnables (which fill initializable
      state and then render into `#app`), with the production features
      `getDiForUnitTesting` omits registered (application, react-application,
      keyboard-shortcuts, metrics).
- [x] A set of **web-platform overrides** in `boot.tsx` stand in for the main
      process at startup: `requestFromChannel` answers the startup channels
      (build-version, app-paths, and an empty default for "request initial X"
      lists), plus app-paths, a fixed dark theme, empty cluster list, a
      default-backed namespace-selection storage, and the product name.

Phase 3 (in progress) — **real data in the real UI**:
- [x] The real Freelens **catalog** lists the **real clusters** from the
      backend's kubeconfig. `boot.tsx` fetches `/api/contexts` and feeds the
      catalog entity registry `KubernetesCluster` entities (the registry is
      normally fed from main over IPC). The catalog table renders them with
      status, icons, search and the row menu — all real components.

- [x] The real **cluster view** renders: `boot.html?cluster=<id>` sets
      `process.isMainFrame=false` and constructs a real `Cluster` for the
      selected context, so the renderer mounts the cluster frame — the real
      cluster **sidebar** (Favorites, Workloads, Network, Helm), the namespace
      selector, the Overview page and the terminal dock, all real components.

- [x] **WebSocket message bridge ("httprender")** — the renderer's messaging
      layer now talks to the backend over `/ws` instead of inline overrides. The
      backend `WsBridge` (`web/backend/src/ws-bridge.ts`) is a channel
      request/message router; `web/backend/src/main-handlers.ts` holds the
      headless "main" handlers (starting with build-version, app-paths). The
      renderer side is a WS-backed `ipcRenderer` (`web/frontend/src/ws-ipc.ts`)
      that the three messaging tokens are pointed at, so the **real**
      `messaging-for-renderer` design runs unchanged over the network. Verified
      end-to-end (a `build-version` round-trip) and the welcome, catalog and
      cluster view all render over it. New handlers grow the headless main
      procedurally.

- [x] **Live resource data in the real pages.** `getDiForUnitTesting`
      global-overrides `fetchInjectable` (id `"fetch"`) with a throwing test
      fake, so every kube-object store load failed with "Tried to invoke fetch
      without override". `boot.tsx` now overrides `fetchInjectable` back to the
      real browser fetch (what `browser-fetch.injectable` does in the production
      renderer). With `shouldShowResource` showing all resources and the
      one-shot `subscribeStores` override firing `loadAll`, the real
      `KubeObjectListLayout` **Pods** page renders live pods from the cluster —
      verified against the `freelens-web` minikube profile: `namespaces`,
      `pods`, `events` and `nodes` all return `200` through `/api-kube`. The
      only `404` is `metrics.k8s.io/v1beta1` (no metrics-server addon), which is
      why CPU/Mem columns show `N/A`.

- [x] **Theme applied (styling fixed).** `getDiForUnitTesting` no-ops
      `applyLensThemeInjectable` (tests do not paint), so the theme CSS custom
      properties were never written and the app rendered black-on-white.
      `boot.tsx` restores the real behavior — writing every theme color as a
      `--<name>` property on `<html>` and toggling the `theme-light` body flag —
      so the real Lens-dark theme paints (dark sidebar, teal active item, dark
      content panels). `app.scss` already locks `html, body, #app` to full
      height with `overflow: hidden`, so there is no stray scroll.

- [x] **Resource visibility from real API discovery.** Replaced the
      `shouldShowResource → true` override with a discovery routine that queries
      the apiserver's own discovery documents through `/api-kube` (`/api/v1`,
      `/apis`, and each group's preferred version) and populates the hosted
      cluster's `resourcesToShow` set with `formatKubeApiResource` keys — the
      web-app stand-in for the discovery the Electron main runs on cluster
      activation. The **real** `shouldShowResource` injectable is left
      untouched, so the sidebar and routes light up only for resource types the
      cluster actually serves. Verified: the Workloads submenu (Pods,
      Deployments, Daemon Sets, Stateful Sets, Replica Sets, Jobs, Cron Jobs)
      and the Nodes / Workloads Overview pages all render with live data.

Remaining (phase 3):
- [ ] Grow `main-handlers.ts` toward the real main: a catalog cluster-list
      handler (replacing the direct `updateItems`), and move cluster activation
      + the API discovery above behind a WS handler (so the renderer no longer
      fetches discovery itself).
- [ ] Optionally run Freelens's real main DI container headless in the backend
      so every channel handler exists automatically.
- [ ] Serve the booted renderer from the backend as the single-origin SPA (so
      in-frame routing uses real paths rather than `/boot.html`).
- [ ] Evaluate shipping deploy/expose as a Freelens feature/extension

## Running it

```bash
# 1. a cluster (dedicated profile used for testing)
minikube start -p freelens-web --driver=docker

# 2. backend API + (in prod) static frontend, on http://127.0.0.1:4300
cd web/backend && pnpm dev

# Development UI with HMR (proxies /api to the backend), on http://127.0.0.1:4310
cd web/frontend && pnpm dev

# Production single-origin: build the UI, then open http://127.0.0.1:4300
cd web/frontend && pnpm build   # backend then serves web/frontend/dist
```

Proven end-to-end against `freelens-web`:

```bash
B=http://127.0.0.1:4300
curl -XPOST $B/api/default/deploy  -d '{"name":"web-demo","image":"nginx:alpine","port":80}'
curl -XPOST $B/api/default/expose  -d '{"name":"web-demo","port":80,"type":"NodePort"}'
curl -XPOST $B/api/portforwards    -d '{"namespace":"default","pod":"<pod>","podPort":80}'
# -> returns a localPort; curl http://127.0.0.1:<localPort>/ serves the nginx page
```

## Log

- Phase 0: plan written, architecture decided, cluster tooling confirmed.
- Phase 1–3: headless backend built and verified end-to-end against minikube
  profile `freelens-web` — deploy nginx, expose NodePort, port-forward, and
  fetched the live nginx welcome page through the forward. Backend is
  dependency-light (Node `http` + `@kubernetes/client-node` + `ws`), run via
  Node's native TypeScript stripping (no build step, no parameter properties).
- Phase 4: Vite + React frontend built, reusing Freelens's real dark-theme
  tokens and `button.scss`. Verified in a browser against the live cluster,
  including a deploy driven from the UI form.
- Phase 5 (partial): backend now serves the built SPA on a single origin, so
  the app runs as one pure-web Node process with no Electron.
- Phase 5 milestone — **real-component reuse unblocked**: `@freelensapp/utilities`
  split into a browser-safe barrel (3 Node modules swapped: base64 via Web APIs,
  tar + union-env-path stubbed), and Freelens's own `standardDecorators()` plugin
  reused so TC39 decorators lower correctly. The actual `@freelensapp/button`
  (tooltip + mobx-react decorators) now renders in a plain browser, dev and prod.
- Phase 5 milestone — **real core data component + DI container in the browser**:
  Freelens's real `SortableTable` from `@freelensapp/core` renders live pod data
  with working sort, inside a scoped renderer DI container (mobx + routing/history
  + storage). Three browser/Node seams handled (node:assert shim, a console
  logger in place of winston, excluding the file-based storage init). This is the
  template for pulling in the rest of the renderer's component tree.
- Phase 5 milestone — **real kube-object API + apiserver proxy**: a backend
  `/api-kube/*` proxy (kubeconfig TLS/auth) stands in for `freelens-proxy`, and
  the table is fed by the real `PodApi` fetching through it — rows are real
  parsed `Pod` kube-objects. The browser seams are consolidated into one
  web-platform layer that supplies the renderer's environment tokens with
  browser values, so growing the surface is a one-line change there.
- Phase 5 milestone — **the whole real renderer boots in a plain browser**
  (phase 1 of the transplant). A complete Node-compat seam layer (vite aliases
  + `src/stubs/*`, both `node:` and bare forms) lets the entire renderer DI wire
  up via `getDiForUnitTesting`; React mounts and renders the real app shell to
  the cluster frame (`/boot.html`). The working app at `/` is unaffected.
- Phase 5 milestone — **the real Freelens Welcome/catalog UI renders in a plain
  browser** (phase 2). Fixing frame selection (`process.isMainFrame`), running
  the real `startApplication()` init, registering the production features, and a
  set of startup overrides that stand in for the main process, the root frame
  now paints the actual Freelens welcome screen and catalog sidebar — real
  components, no crash.
- Phase 5 milestone — **the real catalog lists the real clusters** (phase 3
  start). `boot.tsx` feeds the catalog entity registry `KubernetesCluster`
  entities built from the backend's `/api/contexts`, so the real catalog table
  shows the live kubeconfig clusters (e.g. `freelens-web` connected, plus
  `minikube`, `nora`) with status, icons and search.
- Phase 5 milestone — **the real cluster view renders** (phase 3). With
  `boot.html?cluster=<id>` the renderer mounts the real cluster frame for a
  constructed `Cluster`: the real cluster sidebar (Favorites, Workloads,
  Network, Helm), namespace selector, Overview page and terminal dock.
- Phase 5 milestone — **the WebSocket message bridge ("httprender")**. The
  renderer's messaging runs over `/ws` to a backend `WsBridge` + handler
  registry (the headless "main"), replacing the inline startup overrides. The
  real `messaging-for-renderer` design works unchanged over a WS-backed
  `ipcRenderer`; a `build-version` round-trip is verified and the whole UI
  renders over it. The headless main grows one handler at a time toward cluster
  activation + API discovery (which unlocks the live resource pages).
