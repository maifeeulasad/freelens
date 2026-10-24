/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// A WebSocket-backed stand-in for Electron's ipcRenderer, exposing the small
// surface Freelens's messaging-for-renderer uses: invoke / send / on / off.
// Pointed at the backend's /ws bridge, it lets the real renderer messaging layer
// talk to the headless "main" over the network instead of Electron IPC. This is
// the "httprender" transport.

type IpcListener = (event: unknown, payload: unknown) => void;

export interface WsIpcRenderer {
  invoke(channel: string, payload?: unknown): Promise<unknown>;
  send(channel: string, payload?: unknown): void;
  on(channel: string, listener: IpcListener): WsIpcRenderer;
  off(channel: string, listener: IpcListener): WsIpcRenderer;
}

export function createWsIpcRenderer(url: string): WsIpcRenderer {
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  const listeners = new Map<string, Set<IpcListener>>();
  const outbox: string[] = [];
  let nextId = 1;
  let socket: WebSocket | undefined;

  const flush = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      for (const frame of outbox.splice(0)) socket.send(frame);
    }
  };

  const sendFrame = (frame: unknown) => {
    outbox.push(JSON.stringify(frame));
    flush();
  };

  const connect = () => {
    socket = new WebSocket(url);
    socket.addEventListener("open", flush);
    socket.addEventListener("message", (event) => {
      let msg: { t: string; id?: number; channel?: string; result?: unknown; error?: string; payload?: unknown };
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (msg.t === "res" && msg.id !== undefined) {
        pending.get(msg.id)?.resolve(msg.result);
        pending.delete(msg.id);
      } else if (msg.t === "err" && msg.id !== undefined) {
        pending.get(msg.id)?.reject(new Error(msg.error ?? "bridge error"));
        pending.delete(msg.id);
      } else if (msg.t === "msg" && msg.channel) {
        for (const listener of listeners.get(msg.channel) ?? []) listener({}, msg.payload);
      }
    });
    // Reconnect on drop so the renderer keeps working across backend restarts.
    socket.addEventListener("close", () => setTimeout(connect, 1000));
  };

  connect();

  return {
    invoke(channel, payload) {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        sendFrame({ t: "req", id, channel, payload });
      });
    },
    send(channel, payload) {
      sendFrame({ t: "msg", channel, payload });
    },
    on(channel, listener) {
      const set = listeners.get(channel) ?? new Set<IpcListener>();
      set.add(listener);
      listeners.set(channel, set);
      return this;
    },
    off(channel, listener) {
      listeners.get(channel)?.delete(listener);
      return this;
    },
  };
}
