const ELECTRON_COMMANDS = {
  LOG: "log",
  OS: "get-os",
  SELECT_FILE: "select-file",
  SELECT_FOLDER: "select-folder",
  OPEN_FOLDER: "open-folder",
  NOTIFICATION: "send-notification",
  FETCH_TURBINE_DATA: "fetch-turbine-data",
  SAVE_TURBINE_REPORT: "save-turbine-report",
  SET_NOTIFICATIONS_ENABLED: "set-notifications-enabled",
  GET_SETTINGS: "get-settings",
  SET_SETTINGS: "set-settings",
  ERROR: "error",
} as const;

export { ELECTRON_COMMANDS };