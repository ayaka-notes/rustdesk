import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Public base path. Differs per deploy target:
//   - Docker / nginx  -> served at "/"            (default)
//   - GitHub Pages    -> served at "/rustdesk/"   (project page subpath)
// The Pages workflow sets PORTAL_BASE=/rustdesk/ before `npm run build`.
const base = process.env.PORTAL_BASE || "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: { sourcemap: false },
  server: {
    host: true,
    port: 5173,
  },
});
