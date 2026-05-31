/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/ — Vitest's defineConfig is a superset of Vite's, so
// the React plugin and the test runner share one config.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node"
  }
});
