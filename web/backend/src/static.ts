/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import type { ServerResponse } from "node:http";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

/**
 * Serves files from a built frontend directory, falling back to index.html for
 * client-side routes (SPA behavior). Path traversal outside the root is
 * refused. If the directory does not exist (no build yet), a short hint is
 * returned instead of a crash.
 */
export async function serveStatic(root: string, pathname: string, res: ServerResponse): Promise<void> {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = resolve(join(root, rel));

  if (!filePath.startsWith(resolve(root))) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  let info = await stat(filePath).catch(() => null);

  // Directory or unknown route -> SPA index.html.
  if (!info || info.isDirectory()) {
    filePath = join(root, "index.html");
    info = await stat(filePath).catch(() => null);
  }

  if (!info) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(
      `Frontend not built yet. Run "pnpm --filter @freelensapp/web-frontend build", ` +
        `or use the Vite dev server on :4310 during development.`,
    );
    return;
  }

  res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
  createReadStream(filePath).pipe(res);
}
