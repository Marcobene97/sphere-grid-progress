import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // This only silences the warning threshold; real fix is chunking:
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // split vendor + any heavy libs you might add later
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@tanstack')) return 'vendor-query';
            if (id.includes('@supabase')) return 'vendor-supabase';
            return 'vendor';
          }
        }
      }
    },
    sourcemap: false,
    minify: 'esbuild'
  },
  optimizeDeps: {
    // keep server-only SDKs out of the prebundle if you add them later
    exclude: ['openai'],
  },
}));
