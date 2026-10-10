import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Single source of truth for the app version: read it from package.json so the
// header badge can never drift from the package metadata again.
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
) as { version: string };

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  // GitHub Pages serves project sites from /<repo>/, so the Pages workflow sets
  // VITE_BASE=/modulo/. Local dev and server (nginx) deploys keep the root base.
  base: process.env.VITE_BASE ?? '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3100',
        changeOrigin: false
      },
      // Email verification service blocks cross-origin browser calls, so dev
      // requests go through this proxy. Mirror it in the production reverse
      // proxy (same /mailapi prefix) when deploying.
      '/mailapi': {
        target: 'https://youxiangyanzheng.esdkaiyuan.online',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mailapi/, '/api/v1')
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts'
  }
});
