import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

// GitHub Pages project site. Change here if the repo or custom domain changes.
const base = '/tollywood-arcade/';

export default defineConfig({
  base,
  server: { port: 8080 },
  preview: { port: 8080 },
  build: {
    target: 'es2022',
    minify: 'terser',
    rollupOptions: {
      input: {
        hub: `${root}index.html`,
        notFound: `${root}404.html`,
        credits: `${root}credits.html`,
        egara: `${root}games/egara/index.html`
      },
      output: {
        manualChunks: { phaser: ['phaser'] }
      }
    }
  }
});
