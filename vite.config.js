import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
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