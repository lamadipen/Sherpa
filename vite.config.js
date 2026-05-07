import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'configure-cors-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          next();
        });
      }
    }
  ],
  optimizeDeps: {
    include: ['@babylonjs/core', '@babylonjs/gui', '@babylonjs/loaders']
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.ktx', '**/*.ktx2', '**/*.wasm'],
  build: {
    target: 'esnext'
  }
});
