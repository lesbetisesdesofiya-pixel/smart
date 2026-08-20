import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    base: './',
    root: resolve(__dirname),
    build: {
      outDir: resolve(__dirname, '../../public/app/parentV2'),
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(__dirname, 'index-v2.html'),
      },
    },
    server: {
      port: 3004,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
