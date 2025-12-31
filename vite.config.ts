import { defineConfig } from 'vite';

export default defineConfig({
  base: '/js/',  // GitHub Pages: https://hwkim3330.github.io/js/
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    outDir: 'dist',
    assetsDir: 'assets'
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok']
  }
});
