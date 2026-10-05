import { describe, expect, it } from 'vitest'
import {
  loadPresetsV2,
  loadSessionV2,
  savePresetsV2,
  saveSessionV2,
} from './localStorage'
import {
  LEGACY_PRESETS_KEY,
  LEGACY_SESSION_KEY,
  getStorageKeys,
} from './keys'
import type { CalculatorSessionV2, FormulaPresetV2 } from './types'

class LoggingStorage implements Storage {
  private values = new Map<string, string>()
  reads: string[] = []
  writes: string[] = []

  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) {
    this.reads.push(key)
    return this.values.get(key) ?? null
  }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) {
    this.writes.push(key)
    this.values.set(key, value)
  }
}

const sessionV2: CalculatorSessionV2 = {
  production: {
    mode: 'pieces',
    targetInput: '1000',
    targetUnit: 'kg',
    pieceCountInput: '6',
    pieceMassInput: '280',
    pieceMassUnit: 'g',
    scaleMultiplierInput: '1',
    resultUnit: 'g',
  },
  formula: {
    ingredients: [
      { id: 'water', name: 'Agua', quantity: 70, unit: 'percent', kind: 'water' },
      { id: 'oil', name: 'Aceite', quantity: 15, unit: 'grams', kind: 'custom', massUnit: 'g' },
    ],
    preferments: [],
  },
  planner: { targetDateTimeInput: '', stages: [] },
}

const presetV2: FormulaPresetV2 = {
  id: 'pizza',
  name: 'Pizza',
  formula: sessionV2.formula,
  favorite: false,
  category: null,
  createdAt: '2026-10-05T00:00:00.000Z',
  updatedAt: '2026-10-05T00:00:00.000Z',
}

describe('V2 storage keys and isolation', () => {
  it('uses distinct production and preview namespaces', () => {
    expect(getStorageKeys('production')).toMatchObject({
      session: 'panacalc.session.v2',
      presets: 'panacalc.presets.v2',
    })
    expect(getStorageKeys('preview')).toMatchObject({
      session: 'panacalc.preview.session.v2',
      presets: 'panacalc.preview.presets.v2',
    })
  })

  it('round trips a preview session without reading or writing production/V1 keys', () => {
    const storage = new LoggingStorage()
    expect(saveSessionV2(sessionV2, storage, 'preview')).toBe(true)
    expect(loadSessionV2(storage, 'preview')).toEqual(sessionV2)

    expect(storage.writes).toEqual(['panacalc.preview.session.v2'])
    expect(storage.reads).toEqual(['panacalc.preview.session.v2'])
    expect(storage.reads).not.toContain(LEGACY_SESSION_KEY)
    expect(storage.writes).not.toContain('panacalc.session.v2')
  })

  it('round trips preview presets without touching production/V1 keys', () => {
    const storage = new LoggingStorage()
    expect(savePresetsV2([presetV2], storage, 'preview')).toBe(true)
    expect(loadPresetsV2(storage, 'preview')).toEqual([presetV2])

    expect(storage.writes).toEqual(['panacalc.preview.presets.v2'])
    expect(storage.reads).toEqual(['panacalc.preview.presets.v2'])
    expect(storage.reads).not.toContain(LEGACY_PRESETS_KEY)
  })

  it('migrates valid V1 production data additively and leaves legacy keys intact', () => {
    const storage = new LoggingStorage()
    storage.setItem(LEGACY_SESSION_KEY, JSON.stringify({
      version: 1,
      data: {
        mode: 'flour',
        targetInput: '650',
        formula: {
          ingredients: [
            { id: 'water', name: 'Agua', quantity: 75, unit: 'percent', kind: 'water' },
          ],
        },
      },
    }))

    storage.reads = []
    storage.writes = []
    const migrated = loadSessionV2(storage, 'production')

    expect(migrated.production.mode).toBe('flour')
    expect(migrated.production.targetInput).toBe('650')
    expect(storage.getItem(LEGACY_SESSION_KEY)).not.toBeNull()
    expect(storage.writes).toContain('panacalc.session.v2')
  })

  it('prefers a valid V2 payload and does not re-migrate V1', () => {
    const storage = new LoggingStorage()
    expect(saveSessionV2(sessionV2, storage, 'production')).toBe(true)
    storage.setItem(LEGACY_SESSION_KEY, '{broken')
    storage.reads = []
    storage.writes = []

    expect(loadSessionV2(storage, 'production')).toEqual(sessionV2)
    expect(storage.reads).toEqual(['panacalc.session.v2'])
    expect(storage.writes).toEqual([])
  })

  it('falls back safely for corrupt preview data without probing V1', () => {
    const storage = new LoggingStorage()
    storage.setItem('panacalc.preview.session.v2', '{broken')
    storage.reads = []
    storage.writes = []

    const fallback = loadSessionV2(storage, 'preview')
    expect(fallback.production.mode).toBe('totalMass')
    expect(storage.reads).toEqual(['panacalc.preview.session.v2'])
    expect(storage.writes).toEqual([])
  })
})
