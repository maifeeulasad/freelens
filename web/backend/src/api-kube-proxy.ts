/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { request as httpsRequest, type RequestOptions } from "node:https";
import type { IncomingMessage, ServerResponse } from "node:http";

import type { KubeClients } from "./kube.ts";

export const API_KUBE_PREFIX = "/api-kube";

// Hop-by-hop headers that must not be forwarded verbatim.
const STRIP_REQUEST_HEADERS = new Set(["host", "connection", "content-length", "origin", "referer"]);

/**
 * Proxies a browser request under /api-kube/* to the current cluster's
 * kube-apiserver, applying the kubeconfig's TLS material and credentials. This
 * is the headless-backend equivalent of what freelens-proxy does for the
 * Electron app: the renderer's apiKube talks to its own origin, and this routes
 * that to the real apiserver so the kube-object stores work unchanged.
 */
export async function proxyApiKube(kube: KubeClients, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const cluster = kube.currentCluster();
  if (!cluster?.server) {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "No current cluster in kubeconfig" }));
    return;
  }

  const target = new URL(cluster.server);
  // Strip the /api-kube prefix; forward the rest of the path and query as-is.
  const upstreamPath = (req.url ?? "/").slice(API_KUBE_PREFIX.length) || "/";

  const headers: Record<string, string | string[]> = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined && !STRIP_REQUEST_HEADERS.has(name.toLowerCase())) {
      headers[name] = value;
    }
  }

  const opts: RequestOptions = {
    host: target.hostname,
    port: target.port || 443,
    method: req.method,
    path: upstreamPath,
    headers,
  };

  // Fills in ca/cert/key and any auth (Authorization header or client cert).
  await kube.rawConfig().applyToHTTPSOptions(opts);

  await new Promise<void>((resolve) => {
    const upstream = httpsRequest(opts, (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
      upstreamRes.on("end", resolve);
      upstreamRes.on("error", () => resolve());
    });

    upstream.on("error", (error) => {
      if (!res.writableEnded) {
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: `apiserver proxy failed: ${error.message}` }));
      }
      resolve();
    });

    req.pipe(upstream);
  });
}
