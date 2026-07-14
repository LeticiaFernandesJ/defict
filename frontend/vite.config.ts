import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'hero.png'],
      manifest: {
        name: 'Deficit - Controle Calórico',
        short_name: 'Deficit',
        description:
          'PWA de controle calórico e acompanhamento de emagrecimento com foco em déficit calórico.',
        lang: 'pt-BR',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1B2A4A',
        background_color: '#F5F0E8',
        start_url: '/dashboard',
        icons: [
          { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          { name: 'Dashboard', url: '/dashboard' },
          { name: 'Refeições', url: '/refeicoes' },
        ],
      },
      workbox: {
        importScripts: ['push-handler.js'], // handler de Web Push (push + notificationclick)
        runtimeCaching: [
          {
            // Cache das chamadas à API do Supabase (PostgREST) → app usável offline com dados recentes
            urlPattern: /\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
