import log from "electron-log";
import { getMainWindow } from "../main-window";
import { ELECTRON_COMMANDS } from "../common/electron-commands";

export default function logit(...args: any[]) {
  const mainWindow = getMainWindow();
  log.log(...args);

  if (mainWindow) {
    mainWindow.webContents.send(ELECTRON_COMMANDS.LOG, args.join(" "));
  }
}