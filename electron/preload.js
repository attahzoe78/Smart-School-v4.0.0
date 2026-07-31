/**
 * Smart School - Electron Preload Script
 * Runs in the renderer process with Node.js access
 */
const { contextBridge } = require("electron");

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
