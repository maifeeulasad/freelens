/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser stub for the `electron` module, aliased in for the web build. The
// renderer imports only a handful of electron symbols; most are for features
// that do not apply in a browser (OS clipboard, shell, webFrame zoom). Message
// passing (ipcRenderer) is replaced by the web messaging bridge, so these are
// no-ops that keep the modules loading; anything that truly needs them throws a
// clear error when actually called.

const notAvailable = (name: string) => () => {
  throw new Error(`electron.${name} is not available in the Freelens web build`);
};

export const clipboard = {
  writeText: (text: string) => {
    void globalThis.navigator?.clipboard?.writeText?.(text);
  },
  readText: () => "",
};

export const shell = {
  openExternal: async (url: string) => {
    globalThis.open(url, "_blank", "noopener,noreferrer");
  },
  openPath: notAvailable("shell.openPath"),
  showItemInFolder: notAvailable("shell.showItemInFolder"),
};

export const webFrame = {
  setZoomFactor: () => {},
  getZoomFactor: () => 1,
  setZoomLevel: () => {},
  getZoomLevel: () => 0,
};

// Replaced by the web messaging bridge; present so modules that import it load.
export const ipcRenderer = {
  invoke: async () => undefined,
  send: () => {},
  on: () => ipcRenderer,
  off: () => ipcRenderer,
  removeListener: () => ipcRenderer,
  removeAllListeners: () => ipcRenderer,
};

export const ipcMain = {
  handle: () => {},
  on: () => ipcMain,
  removeHandler: () => {},
};

export const webContents = {
  getAllWebContents: () => [],
  fromId: () => undefined,
};

// Main-process symbols — present so modules load; the injectables that use them
// are overridden with fakes at runtime (and there is no Electron here anyway).
export const app = {
  getPath: (name: string) => `/virtual/${name}`,
  getName: () => "Freelens",
  getVersion: () => "0.0.0",
  getLocale: () => "en",
  on: () => app,
  once: () => app,
  whenReady: async () => undefined,
  quit: () => {},
  exit: () => {},
  getAppPath: () => "/virtual/app",
  setLoginItemSettings: () => {},
  requestSingleInstanceLock: () => true,
};

export class BrowserWindow {
  static getAllWindows() {
    return [];
  }
  static fromId() {
    return undefined;
  }
  on() {
    return this;
  }
}

export const dialog = {
  showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
  showSaveDialog: async () => ({ canceled: true, filePath: undefined }),
  showMessageBox: async () => ({ response: 0 }),
  showErrorBox: () => {},
};

export class Menu {
  static buildFromTemplate() {
    return new Menu();
  }
  static setApplicationMenu() {}
  popup() {}
  append() {}
}

export const MenuItem = class {};

export const nativeTheme = {
  shouldUseDarkColors: true,
  on: () => nativeTheme,
  themeSource: "system",
};

export const powerMonitor = {
  on: () => powerMonitor,
  getSystemIdleTime: () => 0,
};

export const protocol = {
  registerFileProtocol: () => {},
  handle: () => {},
  registerSchemesAsPrivileged: () => {},
};

export const session = {
  defaultSession: {
    on: () => {},
    webRequest: { onBeforeRequest: () => {}, onHeadersReceived: () => {} },
  },
  fromPartition: () => session.defaultSession,
};

export class Tray {
  on() {
    return this;
  }
  setToolTip() {}
  setContextMenu() {}
}

export default {
  clipboard,
  shell,
  webFrame,
  ipcRenderer,
  ipcMain,
  webContents,
  app,
  BrowserWindow,
  dialog,
  Menu,
  MenuItem,
  nativeTheme,
  powerMonitor,
  protocol,
  session,
  Tray,
};
