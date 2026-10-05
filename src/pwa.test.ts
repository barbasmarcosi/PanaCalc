// @vitest-environment node
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PREVIEW_BASE,
  PRODUCTION_BASE,
  createPwaManifest,
  createViteConfig,
  pwaManifest,
} from '../vite.config'
import { getRuntimeChannel } from './config/runtime'
import { getStorageKeys } from './storage/keys'

describe('PWA and Pages configuration', () => {
  it('isolates production and preview base paths', () => {
    expect(PRODUCTION_BASE).toBe('/PanaCalc/')
    expect(PREVIEW_BASE).toBe('/PanaCalc-V2/')
    expect(createViteConfig('production').base).toBe(PRODUCTION_BASE)
    expect(createViteConfig('preview').base).toBe(PREVIEW_BASE)
    expect(createViteConfig('development').base).toBe('/')
  })

  it('ships every icon referenced by the manifest', () => {
    for (const icon of ['icon-192.png', 'icon-512.png', 'maskable-512.png']) {
      expect(existsSync(resolve('public/icons', icon)), `missing public/icons/${icon}`).toBe(true)
    }
  })

  it('defines installable manifests scoped to each deployment', () => {
    expect(pwaManifest).toMatchObject({
      start_url: PRODUCTION_BASE,
      scope: PRODUCTION_BASE,
      display: 'standalone',
    })
    expect(createPwaManifest(PREVIEW_BASE)).toMatchObject({
      start_url: PREVIEW_BASE,
      scope: PREVIEW_BASE,
      display: 'standalone',
    })
    expect(pwaManifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192' }),
      expect.objectContaining({ sizes: '512x512' }),
      expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
    ]))
  })

  it('selects isolated preview storage from preview runtime configuration', () => {
    expect(getRuntimeChannel({ VITE_PANACALC_CHANNEL: 'preview' })).toBe('preview')
    expect(getStorageKeys('preview')).toEqual({
      session: 'panacalc.preview.session.v2',
      presets: 'panacalc.preview.presets.v2',
      preferences: 'panacalc.preview.preferences.v2',
    })
  })
})
