import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  server: { port: 5173 },
  // GitHub Pages serves this project from /dreamloop/, so assets need that prefix.
  base: process.env.GITHUB_ACTIONS ? '/dreamloop/' : '/',
});
