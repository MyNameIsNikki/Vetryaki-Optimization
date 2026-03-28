import { Notification } from "electron";
import fs from "fs";
import { join } from "path";

export default function showNotification(title: string, body: string) {

  const iconPaths = [
    join(__dirname, "../build/icon.png"),
    join(__dirname, "../assets/icon.png"),
  ];

  let iconPath = "";
  for (const path of iconPaths) {
    if (fs.existsSync(path)) {
      iconPath = path;
      break;
    }
  }

  new Notification({
    title,
    body,
    closeButtonText: "Закрыть",
    icon: iconPath || undefined,
  }).show();
}