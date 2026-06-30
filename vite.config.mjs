// File: vite.config.mjs

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // adjust if needed
  publicDir: 'public',
  server: {
    port: 8080,
  }
});
