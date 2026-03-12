import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

import { cloudflare } from "@cloudflare/vite-plugin";

/** Serve landing/index.html at `/` in dev mode */
function landingPagePlugin(): Plugin {
  return {
    name: 'landing-page',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Only intercept exact root path
        if (req.url === '/' || req.url === '/index.html') {
          const landingPath = path.resolve(__dirname, 'landing/index.html')
          if (fs.existsSync(landingPath)) {
            res.setHeader('Content-Type', 'text/html')
            res.end(fs.readFileSync(landingPath, 'utf-8'))
            return
          }
        }
        // Serve landing static assets (css, images, etc.)
        if (req.url?.startsWith('/landing/')) {
          const filePath = path.resolve(__dirname, req.url.slice(1))
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase()
            const mimeTypes: Record<string, string> = {
              '.css': 'text/css',
              '.js': 'application/javascript',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.svg': 'image/svg+xml',
              '.webp': 'image/webp',
              '.gif': 'image/gif',
              '.ico': 'image/x-icon',
              '.woff2': 'font/woff2',
              '.woff': 'font/woff',
            }
            if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext])
            res.end(fs.readFileSync(filePath))
            return
          }
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [landingPagePlugin(), react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 7711,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4488',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})