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
        target: 'https://fateen_backend_dashboard.prideidea.com/',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
