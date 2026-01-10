// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,

    proxy: {
      "/booking": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/catalog": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/identity": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/operations": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },

});
