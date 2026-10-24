/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { IncomingMessage, ServerResponse } from "node:http";

export interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  query: URLSearchParams;
  /** Parsed JSON body, or undefined for bodyless requests. */
  body: unknown;
}

type Handler = (ctx: RouteContext) => unknown | Promise<unknown>;

interface Route {
  method: string;
  segments: string[];
  handler: Handler;
}

/**
 * A minimal path-pattern router over `node:http`, deliberately dependency-free.
 * Patterns use `:name` for a single path segment, e.g. `/api/:ns/pods`.
 */
export class Router {
  private readonly routes: Route[] = [];

  add(method: string, pattern: string, handler: Handler): this {
    this.routes.push({
      method: method.toUpperCase(),
      segments: pattern.split("/").filter(Boolean),
      handler,
    });
    return this;
  }

  get(pattern: string, handler: Handler): this {
    return this.add("GET", pattern, handler);
  }

  post(pattern: string, handler: Handler): this {
    return this.add("POST", pattern, handler);
  }

  delete(pattern: string, handler: Handler): this {
    return this.add("DELETE", pattern, handler);
  }

  private match(method: string, pathname: string): { route: Route; params: Record<string, string> } | null {
    const parts = pathname.split("/").filter(Boolean);

    for (const route of this.routes) {
      if (route.method !== method) continue;
      if (route.segments.length !== parts.length) continue;

      const params: Record<string, string> = {};
      let ok = true;

      for (let i = 0; i < route.segments.length; i++) {
        const seg = route.segments[i]!;
        if (seg.startsWith(":")) {
          params[seg.slice(1)] = decodeURIComponent(parts[i]!);
        } else if (seg !== parts[i]) {
          ok = false;
          break;
        }
      }

      if (ok) return { route, params };
    }

    return null;
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", "http://localhost");
    const matched = this.match(req.method ?? "GET", url.pathname);

    if (!matched) {
      sendJson(res, 404, { error: `No route for ${req.method} ${url.pathname}` });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const result = await matched.route.handler({
        req,
        res,
        params: matched.params,
        query: url.searchParams,
        body,
      });

      // A handler that wrote the response itself (e.g. a stream) returns
      // undefined after ending it; only serialize when nothing was sent.
      if (!res.writableEnded) {
        sendJson(res, 200, result ?? null);
      }
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode ?? 500;
      const message = error instanceof Error ? error.message : String(error);
      if (!res.writableEnded) {
        sendJson(res, status, { error: message });
      }
    }
  }
}

export function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const data = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(data),
  });
  res.end(data);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "DELETE") {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }

  if (chunks.length === 0) return undefined;

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return undefined;

  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error("Request body is not valid JSON") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
}
