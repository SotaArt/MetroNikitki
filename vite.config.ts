import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/MetroNikitki/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['icons/Icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'wagons/*.png'],
      manifest: {
        name: 'МетроПати',
        short_name: 'МетроПати',
        description: 'Детская игра про метро',
        start_url: '/MetroNikitki/',
        scope: '/MetroNikitki/',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#8fdcff',
        theme_color: '#7fd3ff',
        lang: 'ru',
        icons: [
          {
            src: '/MetroNikitki/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/MetroNikitki/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/MetroNikitki/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      },
      devOptions: {
        enabled: false
      }
    })
  ],
})
