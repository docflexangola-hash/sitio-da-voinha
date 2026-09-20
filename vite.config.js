import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [],
  build: {
    target: 'es2018',
    cssTarget: 'chrome90',
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
    },
  },
});