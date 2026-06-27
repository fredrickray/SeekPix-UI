import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const BACKEND = process.env.SEEKPIX_API_URL ?? "http://127.0.0.1:8000";

// The backend returns relative image URLs such as /photos/16/thumbnail, so those
// paths are proxied here and <img src> works without rewriting anything.
const apiPaths = [
  "/search",
  "/photos",
  "/jobs",
  "/stats",
  "/index",
  "/faces",
  "/health",
];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: Object.fromEntries(
      apiPaths.map((path) => [
        path,
        { target: BACKEND, changeOrigin: true },
      ]),
    ),
  },
});
