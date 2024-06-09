const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
  changeSettings: (settings) => ipcRenderer.send("change-settings", settings),
  getSettings: (setting) => ipcRenderer.invoke("get-settings", setting),
  openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  closeWindow: () => ipcRenderer.send("close-window"),
  error: (err) => ipcRenderer.invoke("error", err),
  closeApp: () => ipcRenderer.send("close-app"),
  settings: () => ipcRenderer.send("settings"),
  launch: () => ipcRenderer.send("launch"),
  auth: () => ipcRenderer.send("auth"),
});
