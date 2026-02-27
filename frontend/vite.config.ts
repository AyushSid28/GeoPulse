import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'GeoPulse',
        short_name: 'GeoPulse',
        description: 'Track any Indian train, live. Powered by AI.',
        theme_color: '#1e3a8a',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/stations/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'stations-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /\/api\/trains(?!.*\/live)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'trains-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /\/api\/trains\/.*\/route$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'routes-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /\/api\/trains\/.*\/live/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
