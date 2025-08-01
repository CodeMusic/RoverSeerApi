import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["musai.codemusic.ca","m2cbook.local", "localhost", "127.0.0.1", "0.0.0.0"],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["uuid"], // Ensures uuid is properly bundled
  },
  build: {
    target: "esnext", // Ensure latest JS features are supported
    minify: false, // Disable minification for debugging
  },
}));
