import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/hab/", // 👈 CRITICAL FIX — ensures asset URLs are /hab/assets/*
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
  },
});
