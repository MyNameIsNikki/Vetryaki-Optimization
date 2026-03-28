export {};
declare global {
    interface Window {
        electron: {
            send: (channel: string, payload: any) => void;
            on: (channel: string, func: (event: any, ...args: any[]) => void) => void;
            invoke: (channel: string, payload?: any) => Promise<any>;
            platform: string;
            getSystemInfo: () => Promise<any>;
            getAppVersion: () => Promise<string>;
            openNewWindow: () => Promise<void>;
        };
    }
}