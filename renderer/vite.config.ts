import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "components"),
      "@pages": path.resolve(__dirname, "pages"),
      "@styles": path.resolve(__dirname, "styles"),
    },
  },
});