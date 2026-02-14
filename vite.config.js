import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.ttf"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3002,
    open: true,
    https: {
      key: fs.readFileSync(
        "C:/Users/DILAN/Downloads/YY-YQMS/YY-YQMS/backend/Config/192.167.14.235-key.pem",
      ),
      cert: fs.readFileSync(
        "C:/Users/DILAN/Downloads/YY-YQMS/YY-YQMS/backend/Config/192.167.14.235.pem",
      ),
    },
  },
  build: {
    //minify: false, // Use esbuild for minification
    sourcemap: true,
    chunkSizeWarningLimit: 20000,
  },
});
