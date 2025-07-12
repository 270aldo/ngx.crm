import react from "@vitejs/plugin-react";
import "dotenv/config";
import path from "node:path";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_ID__: JSON.stringify("nexus-crm"),
    __API_PATH__: JSON.stringify("/routes"),
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || "http://localhost:8000"),
    __WS_API_URL__: JSON.stringify(process.env.VITE_WS_API_URL || "ws://localhost:8000"),
    __APP_BASE_PATH__: JSON.stringify("/"),
    __APP_TITLE__: JSON.stringify("NexusCRM - NGX Internal"),
    __APP_FAVICON_LIGHT__: JSON.stringify("/favicon-light.svg"),
    __APP_FAVICON_DARK__: JSON.stringify("/favicon-dark.svg"),
    __APP_DEPLOY_USERNAME__: JSON.stringify("ngx"),
    __APP_DEPLOY_APPNAME__: JSON.stringify("nexus-crm"),
    __APP_DEPLOY_CUSTOM_DOMAIN__: JSON.stringify(""),
    __FIREBASE_CONFIG__: JSON.stringify(""),
  },
  plugins: [react(), tsConfigPaths()],
  server: {
    port: 5173,
    proxy: {
      "/routes": {
        target: process.env.VITE_API_URL || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});