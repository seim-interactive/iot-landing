// Compila el frontend real de la plataforma como demo sin backend.
// Se usa desde build.sh, parado en la copia del frontend.
import { defineConfig, mergeConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import base from './vite.config.js';

const demo = (file) => fileURLToPath(new URL(`./demo/${file}`, import.meta.url));

// Los chunks manuales del original nombran a Firebase, que acá no existe.
const { build: _build, ...rest } = base;

export default mergeConfig(
  rest,
  defineConfig({
    base: '/plataforma/',
    resolve: {
      alias: {
        'firebase/app': demo('firebase-app.ts'),
        'firebase/auth': demo('firebase-auth.ts'),
      },
    },
    build: {
      outDir: 'dist-demo',
      emptyOutDir: true,
      rollupOptions: { input: fileURLToPath(new URL('./demo.html', import.meta.url)) },
    },
  })
);
