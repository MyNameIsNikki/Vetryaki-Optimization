import { app, BrowserWindow } from "electron";
import { createMainWindow } from "./main-window";

app.on("ready", () => {
  createMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});