import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          { urlPattern: /^https?:\/\/.*\/api\//, handler: 'NetworkFirst', options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 } }
        ]
      },
      manifest: {
        name: 'Suivi Auguste',
        short_name: 'Auguste',
        description: 'Suivi comportemental d\'Auguste',
        theme_color: '#f1f5f9',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      devOptions: { enabled: true }
    })
  ],
  server: {
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }
  }
});
