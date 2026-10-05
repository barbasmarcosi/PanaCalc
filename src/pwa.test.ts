// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { PAGES_BASE, createViteConfig, pwaManifest } from '../vite.config'

describe('PWA and Pages configuration', () => {
  it('uses the repository base path only for production builds', () => {
    expect(PAGES_BASE).toBe('/PanaCalc/')
    expect(createViteConfig('production').base).toBe('/PanaCalc/')
    expect(createViteConfig('development').base).toBe('/')
  })

  it('defines an installable scoped manifest with required icons', () => {
    expect(pwaManifest).toMatchObject({
      name: 'PanaCalc',
      short_name: 'PanaCalc',
      start_url: '/PanaCalc/',
      scope: '/PanaCalc/',
      display: 'standalone',
      theme_color: '#9a4c19',
    })
    expect(pwaManifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192' }),
      expect.objectContaining({ sizes: '512x512' }),
      expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
    ]))
  })
})
