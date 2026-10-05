import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SESSION,
  PRESETS_KEY,
  SESSION_KEY,
  loadPresets,
  loadSession,
  savePresets,
  saveSession,
} from './localStorage'
import type { CalculatorSession, FormulaPreset } from './types'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const session: CalculatorSession = {
  mode: 'flour',
  targetInput: '650,5',
  formula: {
    ingredients: [
      { id: 'water', name: 'Agua', quantity: 75, unit: 'percent', kind: 'water' },
      { id: 'salt', name: 'Sal', quantity: 2.5, unit: 'percent', kind: 'custom' },
    ],
  },
}

const preset: FormulaPreset = {
  id: 'pizza',
  name: 'Pizza',
  formula: session.formula,
  createdAt: '2026-10-05T00:00:00.000Z',
  updatedAt: '2026-10-05T00:00:00.000Z',
}

describe('session storage', () => {
  it('round trips a valid session', () => {
    const storage = new MemoryStorage()
    expect(saveSession(session, storage)).toBe(true)
    expect(loadSession(storage)).toEqual(session)
  })

  it.each(['{broken', JSON.stringify({ version: 1, data: { nope: true } }), JSON.stringify({ version: 2, data: session })])(
    'falls back for corrupt or invalid session payload %s',
    (payload) => {
      const storage = new MemoryStorage()
      storage.setItem(SESSION_KEY, payload)
      expect(loadSession(storage)).toEqual(DEFAULT_SESSION)
    },
  )

  it('falls back when getItem throws', () => {
    const storage = new MemoryStorage()
    storage.getItem = () => { throw new DOMException('blocked', 'SecurityError') }
    expect(loadSession(storage)).toEqual(DEFAULT_SESSION)
  })

  it('returns false when setItem throws', () => {
    const storage = new MemoryStorage()
    storage.setItem = () => { throw new DOMException('quota', 'QuotaExceededError') }
    expect(saveSession(session, storage)).toBe(false)
  })

  it('rejects persisted formulas where water is not percentage-based', () => {
    const storage = new MemoryStorage()
    storage.setItem(SESSION_KEY, JSON.stringify({
      version: 1,
      data: {
        ...session,
        formula: {
          ingredients: [
            { id: 'water', name: 'Agua', quantity: 70, unit: 'grams', kind: 'water' },
          ],
        },
      },
    }))
    expect(loadSession(storage)).toEqual(DEFAULT_SESSION)
  })
})

describe('preset storage', () => {
  it('round trips valid presets without batch mode or target', () => {
    const storage = new MemoryStorage()
    expect(savePresets([preset], storage)).toBe(true)
    expect(loadPresets(storage)).toEqual([preset])
    const raw = storage.getItem(PRESETS_KEY) ?? ''
    expect(raw).not.toContain('targetInput')
    expect(raw).not.toContain('"mode"')
  })

  it.each(['not-json', JSON.stringify({ version: 1, data: [{ id: 2 }] }), JSON.stringify({ version: 9, data: [preset] })])(
    'falls back for corrupt or invalid preset payload %s',
    (payload) => {
      const storage = new MemoryStorage()
      storage.setItem(PRESETS_KEY, payload)
      expect(loadPresets(storage)).toEqual([])
    },
  )

  it('handles preset read and write exceptions safely', () => {
    const readStorage = new MemoryStorage()
    readStorage.getItem = () => { throw new Error('nope') }
    expect(loadPresets(readStorage)).toEqual([])

    const writeStorage = new MemoryStorage()
    writeStorage.setItem = () => { throw new Error('nope') }
    expect(savePresets([preset], writeStorage)).toBe(false)
  })
})
