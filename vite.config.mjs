
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',               
  publicDir: 'public',      
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),  
    },
    outDir: 'dist',       
    emptyOutDir: false,    
  },
  server: {
    port: 8080,
    open: true,
  },
});
