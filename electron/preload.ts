import { contextBridge, ipcRenderer } from "electron";
import { getAppVersion, getDeviceSpecs, getPlatform } from "./utils/get-device-specs";

contextBridge.exposeInMainWorld("electron", {
  send: (channel: string, payload: any) => ipcRenderer.send(channel, payload),
  on: (channel: string, func: (...args: any) => void) =>
    ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),
  invoke: (channel: string, payload: any) => ipcRenderer.invoke(channel, payload),
  platform: getPlatform(),
  getSystemInfo: async () => await getDeviceSpecs(),
  getAppVersion: async () => await getAppVersion(),
});