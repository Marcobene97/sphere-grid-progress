import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { Buffer } from 'buffer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    'global': 'globalThis',
    'process.env': '{}',
  },
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
      'stream': 'stream-browserify',
      'buffer': 'buffer',
    },
    dedupe: ['react', 'react-dom'],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  build: {
    // This only silences the warning threshold; real fix is chunking:
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Ensure polyfills load first by putting them in the entry chunk
        manualChunks(id) {
          // Don't split react into separate chunk - keep it with polyfills in entry
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack')) return 'vendor-query';
            if (id.includes('@supabase')) return 'vendor-supabase';
            // Group all radix-ui together with react to ensure proper initialization
            if (id.includes('@radix-ui') || id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
        }
      }
    },
    sourcemap: true,
    minify: 'esbuild'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'buffer', 'stream-browserify'],
    exclude: ['openai'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
    },
  },
}));
