import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Purely client-side prototype — no backend, no data persistence.
export default defineConfig({
  plugins: [react()],
  server: { open: true },
});
