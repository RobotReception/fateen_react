import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 7711,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://161.97.117.77:4488',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
