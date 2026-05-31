import { defineConfig } from "vitest/config";

// The official Vite scaffold ships no config file; this one exists only to point
// Vitest at the node test environment. Build/dev use Vite 8 defaults.
export default defineConfig({
  test: {
    environment: "node"
  }
});
