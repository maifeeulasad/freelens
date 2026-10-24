/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { type WebSocket, WebSocketServer } from "ws";
import type { Server } from "node:http";

// The main side of the renderer<->main message bridge, over WebSocket. It is the
// network equivalent of Freelens's Electron IPC: the renderer's messaging layer
// is pointed at a WS-backed ipcRenderer (see web/frontend/src/ws-ipc.ts), and
// this routes those requests/messages to handlers registered here — where the
// (headless) main-side logic lives.
//
// Wire protocol (JSON per frame):
//   renderer -> main   { t: "req", id, channel, payload }   (request/response)
//   main -> renderer   { t: "res", id, result }
//   main -> renderer   { t: "err", id, error }
//   renderer -> main   { t: "msg", channel, payload }        (fire-and-forget)
//   main -> renderer   { t: "msg", channel, payload }        (push)

type RequestHandler = (payload: unknown) => unknown | Promise<unknown>;
type MessageHandler = (payload: unknown) => void;

export class WsBridge {
  private readonly requestHandlers = new Map<string, RequestHandler>();
  private readonly messageHandlers = new Map<string, Set<MessageHandler>>();
  private readonly clients = new Set<WebSocket>();

  /** Register the single request/response handler for a channel. */
  onRequest(channel: string, handler: RequestHandler): this {
    this.requestHandlers.set(channel, handler);
    return this;
  }

  /** Register a fire-and-forget message handler for a channel. */
  onMessage(channel: string, handler: MessageHandler): this {
    const set = this.messageHandlers.get(channel) ?? new Set<MessageHandler>();
    set.add(handler);
    this.messageHandlers.set(channel, set);
    return this;
  }

  /** Push a message to every connected renderer on a channel. */
  broadcast(channel: string, payload: unknown): void {
    const frame = JSON.stringify({ t: "msg", channel, payload });
    for (const ws of this.clients) {
      if (ws.readyState === ws.OPEN) ws.send(frame);
    }
  }

  /** Attach the WS server to the shared HTTP server at /ws. */
  attach(server: Server): void {
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (ws) => {
      this.clients.add(ws);

      ws.on("message", (raw) => {
        void this.handleFrame(ws, raw.toString());
      });

      ws.on("close", () => this.clients.delete(ws));
      ws.on("error", () => this.clients.delete(ws));
    });
  }

  private async handleFrame(ws: WebSocket, raw: string): Promise<void> {
    let msg: { t: string; id?: number; channel?: string; payload?: unknown };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.t === "req" && msg.channel) {
      const handler = this.requestHandlers.get(msg.channel);
      try {
        // Unhandled channels default to an empty list: most startup "request
        // initial X" channels expect an array, and this keeps the renderer from
        // iterating undefined while handlers are filled in incrementally.
        const result = handler ? await handler(msg.payload) : [];
        ws.send(JSON.stringify({ t: "res", id: msg.id, result }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ws.send(JSON.stringify({ t: "err", id: msg.id, error: message }));
      }
      return;
    }

    if (msg.t === "msg" && msg.channel) {
      for (const handler of this.messageHandlers.get(msg.channel) ?? []) {
        handler(msg.payload);
      }
    }
  }
}
