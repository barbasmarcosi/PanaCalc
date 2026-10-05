import react from '@vitejs/plugin-react'
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa'
import { defineConfig, type UserConfig } from 'vitest/config'

export const PRODUCTION_BASE = '/PanaCalc/'
export const PREVIEW_BASE = '/PanaCalc-V2/'
export const PAGES_BASE = PRODUCTION_BASE

export function getPagesBase(mode: string): string {
  if (mode === 'preview') return PREVIEW_BASE
  if (mode === 'production') return PRODUCTION_BASE
  return '/'
}

export function createPwaManifest(base: string): Partial<ManifestOptions> {
  return {
    name: 'PanaCalc',
    short_name: 'PanaCalc',
    description: 'Calculadora mobile de masas y porcentajes de panadero.',
    lang: 'es',
    start_url: base,
    scope: base,
    display: 'standalone',
    background_color: '#f7f2e9',
    theme_color: '#9a4c19',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

export const pwaManifest = createPwaManifest(PRODUCTION_BASE)

export function createViteConfig(mode: string): UserConfig {
  const base = getPagesBase(mode)
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: createPwaManifest(base),
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
