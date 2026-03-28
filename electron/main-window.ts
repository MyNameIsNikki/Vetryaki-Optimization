import { app, BrowserWindow, shell } from "electron";
import { getPlatform } from "./utils/get-device-specs";
import { join } from "path";
import electronIsDev from "electron-is-dev";
import { format } from "url";
import { autoUpdater } from "electron-updater";

let mainWindow: BrowserWindow | null = null;

export const createMainWindow = () => {
  console.log("📂 DIRNAME:", __dirname);
  console.log("🚃 App Path:", app.getAppPath());

  mainWindow = new BrowserWindow({
    icon: join(__dirname, "build", "icon.png"),
    width: 1100,
    height: 840,
    minHeight: 840,
    minWidth: 1100,
    maxHeight: 840,
    maxWidth: 1100,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
    },
    titleBarStyle: getPlatform() === "mac" ? "hiddenInset" : "default",
  });

  const url = electronIsDev
    ? "http://localhost:3000"
    : format({
        pathname: join(__dirname, "../renderer/dist/index.html"),
        protocol: "file:",
        slashes: true,
      });

  mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  if (!electronIsDev) {
    console.log("🚀 Проверка обновлений");
    autoUpdater.checkForUpdates();
  }

  mainWindow.setMenuBarVisibility(false);
};

export const getMainWindow = () => {
  return mainWindow;
};