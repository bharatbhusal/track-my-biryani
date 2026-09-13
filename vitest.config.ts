import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    // The runner-free settle.self.test.ts is scaffolding imported by
    // settle.test.ts (via `demo()`); it has no it() blocks of its own.
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", "src/lib/settle.self.test.ts"],
  },
});
