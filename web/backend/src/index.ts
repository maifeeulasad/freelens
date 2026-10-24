/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { API_KUBE_PREFIX, proxyApiKube } from "./api-kube-proxy.ts";
import { KubeClients } from "./kube.ts";
import { registerMainHandlers } from "./main-handlers.ts";
import { PortForwardManager } from "./port-forward.ts";
import { Router, sendJson } from "./router.ts";
import { serveStatic } from "./static.ts";
import { type DeploySpec, deleteDeployment, deploy, type ExposeSpec, expose, rolloutStatus } from "./workloads.ts";
import { WsBridge } from "./ws-bridge.ts";

const port = Number(process.env.PORT ?? 4300);
const host = process.env.HOST ?? "127.0.0.1";

// In production the backend serves the built frontend from a single origin, so
// the whole app is one pure-web process with no Electron. Defaults to the
// sibling frontend build; override with FRONTEND_DIR.
const frontendDir = process.env.FRONTEND_DIR ?? fileURLToPath(new URL("../../frontend/dist", import.meta.url));

const kube = new KubeClients();
const portForwards = new PortForwardManager(kube);
const wsBridge = new WsBridge();
registerMainHandlers(wsBridge, kube);
const router = new Router();

// --- Meta -----------------------------------------------------------------

router.get("/api/health", () => ({ status: "ok", time: new Date().toISOString() }));

router.get("/api/contexts", () => {
  const { contexts, currentContext } = kube.listContexts();
  return {
    currentContext,
    contexts: contexts.map((c) => ({ name: c.name, cluster: c.cluster, user: c.user })),
  };
});

router.post("/api/contexts/use", ({ body }) => {
  const name = (body as { name?: string } | undefined)?.name;
  if (!name) {
    const err = new Error("Missing 'name' in body") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  kube.useContext(name);
  return { currentContext: name };
});

// --- Read path -------------------------------------------------------------

router.get("/api/namespaces", async () => {
  const res = await kube.core().listNamespace();
  return {
    items: res.items.map((ns) => ({
      name: ns.metadata?.name,
      status: ns.status?.phase,
      createdAt: ns.metadata?.creationTimestamp,
    })),
  };
});

router.get("/api/:ns/deployments", async ({ params }) => {
  const res = await kube.apps().listNamespacedDeployment({ namespace: params.ns! });
  return {
    items: res.items.map((d) => ({
      name: d.metadata?.name,
      replicas: d.status?.replicas ?? 0,
      ready: d.status?.readyReplicas ?? 0,
      available: d.status?.availableReplicas ?? 0,
      images: d.spec?.template.spec?.containers.map((c) => c.image) ?? [],
      createdAt: d.metadata?.creationTimestamp,
    })),
  };
});

router.get("/api/:ns/pods", async ({ params }) => {
  const res = await kube.core().listNamespacedPod({ namespace: params.ns! });
  return {
    items: res.items.map((p) => ({
      name: p.metadata?.name,
      phase: p.status?.phase,
      node: p.spec?.nodeName,
      restarts: p.status?.containerStatuses?.reduce((n, cs) => n + cs.restartCount, 0) ?? 0,
      createdAt: p.metadata?.creationTimestamp,
    })),
  };
});

router.get("/api/:ns/services", async ({ params }) => {
  const res = await kube.core().listNamespacedService({ namespace: params.ns! });
  return {
    items: res.items.map((s) => ({
      name: s.metadata?.name,
      type: s.spec?.type,
      clusterIP: s.spec?.clusterIP,
      ports: s.spec?.ports?.map((pt) => ({
        port: pt.port,
        targetPort: pt.targetPort,
        nodePort: pt.nodePort,
        protocol: pt.protocol,
      })),
    })),
  };
});

// --- Deploy & expose -------------------------------------------------------

router.post("/api/:ns/deploy", async ({ params, body }) => {
  const result = await deploy(kube, params.ns!, body as DeploySpec);
  return { name: result.metadata?.name, namespace: params.ns };
});

router.get("/api/:ns/deployments/:name/status", ({ params }) => rolloutStatus(kube, params.ns!, params.name!));

router.delete("/api/:ns/deployments/:name", async ({ params }) => {
  await deleteDeployment(kube, params.ns!, params.name!);
  return { deleted: params.name };
});

router.post("/api/:ns/expose", async ({ params, body }) => {
  const result = await expose(kube, params.ns!, body as ExposeSpec);
  return {
    name: result.metadata?.name,
    type: result.spec?.type,
    clusterIP: result.spec?.clusterIP,
    ports: result.spec?.ports,
  };
});

// --- Port forwarding -------------------------------------------------------

router.get("/api/portforwards", () => ({ items: portForwards.list() }));

router.post("/api/portforwards", async ({ body }) => {
  const { namespace, pod, podPort, localPort } = (body ?? {}) as {
    namespace?: string;
    pod?: string;
    podPort?: number;
    localPort?: number;
  };
  if (!namespace || !pod || !podPort) {
    const err = new Error("Missing namespace, pod, or podPort") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  return portForwards.start({ namespace, pod, podPort, localPort });
});

router.delete("/api/portforwards/:id", ({ params }) => ({
  stopped: portForwards.stop(params.id!),
}));

// --- Server ----------------------------------------------------------------

const server = createServer((req, res) => {
  // CORS for the Vite dev server during development.
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");

  // Raw apiserver proxy for the renderer's kube-object stores.
  if (url.pathname === API_KUBE_PREFIX || url.pathname.startsWith(`${API_KUBE_PREFIX}/`)) {
    proxyApiKube(kube, req, res).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!res.writableEnded) sendJson(res, 502, { error: message });
    });
    return;
  }

  // API goes to the router; everything else is a static asset / SPA route.
  if (url.pathname.startsWith("/api/")) {
    router.handle(req, res).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!res.writableEnded) sendJson(res, 500, { error: message });
    });
    return;
  }

  serveStatic(frontendDir, url.pathname, res).catch(() => {
    if (!res.writableEnded) sendJson(res, 500, { error: "static serve failed" });
  });
});

// The renderer<->main message bridge rides on the same HTTP server, at /ws.
wsBridge.attach(server);

server.listen(port, host, () => {
  const { currentContext } = kube.listContexts();
  console.log(`[freelens-web] backend listening on http://${host}:${port}`);
  console.log(`[freelens-web] kube context: ${currentContext || "(none)"}`);
  console.log(`[freelens-web] message bridge on ws://${host}:${port}/ws`);
});
