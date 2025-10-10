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
      // Ensure single React instance
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Critical: Keep React and Radix in same chunk to prevent duplicate React instances
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Radix UI MUST be bundled with React to avoid separate React instances
            if (id.includes('react') || id.includes('@radix-ui')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack')) return 'vendor-query';
            if (id.includes('@supabase')) return 'vendor-supabase';
            return 'vendor';
          }
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
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
