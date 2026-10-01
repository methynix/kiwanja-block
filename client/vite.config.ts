import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Kiwanja Block',
        short_name: 'Kiwanja',
        description: 'Offline-first land registry',
        theme_color: '#1f6f43',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      devOptions: { enabled: true },
    }),
  ],
  // PouchDB references Node's `global`
  define: { global: 'globalThis' },
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
})
