import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // Include these in the pre-cache alongside the built assets
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-64.png',
        'pwa-192.png',
        'pwa-512.png',
      ],

      // ── Web App Manifest ──────────────────────────────────────
      manifest: {
        name: 'Budgetarko',
        short_name: 'Budgetarko',
        description: 'Personal finance tracker — capture on phone, review on desktop',
        theme_color: '#1f8a5b',
        background_color: '#f4f3ef',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'en',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: 'pwa-64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            // Maskable: full-bleed green background → OS applies shape mask
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      // ── Workbox service worker config ─────────────────────────
      workbox: {
        // Pre-cache all built static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Runtime caching for external requests
        runtimeCaching: [
          // Google Fonts CSS (cache-first, 1-year TTL)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts files (cache-first, 1-year TTL)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase REST/auth API (network-first, 24h fallback cache)
          {
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours fallback
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Split heavy dependencies so the main chunk stays small
        manualChunks: {
          vendor:    ['react', 'react-dom', 'react-router-dom'],
          supabase:  ['@supabase/supabase-js'],
          query:     ['@tanstack/react-query'],
          forms:     ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
})
