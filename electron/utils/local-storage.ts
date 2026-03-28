import { getMainWindow } from "../main-window";

export const localStorage = {
  get: async <T>(key: string, parse: boolean = false): Promise<T | null> => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;

    try {
      const localStorageValue = await mainWindow.webContents.executeJavaScript(
        `localStorage.getItem("${key}");`,
        true
      );
      if (localStorageValue) {
        return parse ? JSON.parse(localStorageValue) : localStorageValue;
      }
      return null;
    } catch (error) {
      console.error(`Ошибка получения ${key} из localStorage:`, error);
      return null;
    }
  },

  set: async (key: string, value: any): Promise<void> => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return;

    try {
      await mainWindow.webContents.executeJavaScript(
        `localStorage.setItem("${key}", ${JSON.stringify(JSON.stringify(value))});`,
        true
      );
    } catch (error) {
      console.error(`Ошибка установки ${key} в localStorage:`, error);
    }
  },
};