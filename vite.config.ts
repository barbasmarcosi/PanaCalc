import react from '@vitejs/plugin-react'
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa'
import { defineConfig, type UserConfig } from 'vitest/config'

export const PAGES_BASE = '/PanaCalc/'

export const pwaManifest: Partial<ManifestOptions> = {
  name: 'PanaCalc',
  short_name: 'PanaCalc',
  description: 'Calculadora mobile de masas y porcentajes de panadero.',
  lang: 'es',
  start_url: PAGES_BASE,
  scope: PAGES_BASE,
  display: 'standalone',
  background_color: '#f7f2e9',
  theme_color: '#9a4c19',
  icons: [
    {
      src: 'icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'icons/maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
}

export function createViteConfig(mode: string): UserConfig {
  const base = mode === 'production' ? PAGES_BASE : '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: pwaManifest,
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
    },
  }
}

export default defineConfig(({ mode }) => createViteConfig(mode))
