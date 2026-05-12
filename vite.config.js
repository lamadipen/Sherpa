import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 5200
  },
  server: {
    host: '0.0.0.0'
  }
});
