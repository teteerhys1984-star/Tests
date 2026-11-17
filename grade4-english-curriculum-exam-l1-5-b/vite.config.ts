import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Version B publishes one self-contained HTML file, exactly like Version A:
// relative base (so it works under /Tests/<exam-folder>/), every JS, CSS, font
// and image inlined by vite-plugin-singlefile, and no external asset requests.
export default defineConfig({
  base: "./",
  server: { host: "0.0.0.0" },
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
