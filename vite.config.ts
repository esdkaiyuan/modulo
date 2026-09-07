import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
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
