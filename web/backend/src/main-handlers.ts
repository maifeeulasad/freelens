/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { KubeClients } from "./kube.ts";
import type { WsBridge } from "./ws-bridge.ts";

// Virtual app paths for the browser (the Electron main returns real OS paths).
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

/**
 * The headless "main" side: the message-channel handlers the renderer requests
 * at startup and at runtime. This begins with the startup channels the inline
 * boot overrides used to cover, and grows toward the real main process's
 * responses (catalog, cluster state, ...). Everything else defaults to an empty
 * list in the bridge.
 */
export function registerMainHandlers(bridge: WsBridge, _kube: KubeClients): void {
  bridge.onRequest("build-version", () => "1.0.0");
  bridge.onRequest("app-paths", () => virtualAppPaths);
}
