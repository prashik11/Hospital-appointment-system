import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Forward same-origin API requests through Vite during local/demo use.
  // This lets a temporary tunnel expose one URL for both the UI and API.
  server: {
    proxy: {
      "/graphql": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
