import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // Node by default; the DOM flow test opts in with
    // `// @vitest-environment jsdom` at the top of the file.
    environment: "node",
    include: ["src/**/*.spec.ts", "src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
