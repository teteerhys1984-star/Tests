import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ناتج واحد مكتفٍ بذاته: dist/index.html يحمل كل CSS وJS والصور والمُخدَّرات المضمّنة،
 * بلا أي مورد خارجي — وهو ما يتوقّعه نشر المنصة (نسخ dist/index.html فقط).
 * خط IBM Plex Sans Arabic المضمَّن محلياً مستورد كـ @fontsource والكاجاكس (KaTeX).
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
