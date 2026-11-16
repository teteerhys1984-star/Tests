import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
    ],
    // The frozen TXT report baseline uses toLocaleString("en-GB"); fix the zone so
    // the golden hashes are reproducible on any machine.
    env: { TZ: "UTC" },
  },
});
