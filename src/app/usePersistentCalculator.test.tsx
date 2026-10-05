import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { loadPresetsV2, loadSessionV2, saveSession } from '../storage/localStorage'
import type { CalculatorSession } from '../storage/types'
import { usePersistentCalculator } from './usePersistentCalculator'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const savedSession: CalculatorSession = {
  mode: 'flour',
  targetInput: '650',
  formula: {
    ingredients: [
      { id: 'water', name: 'Agua', quantity: 75, unit: 'percent', kind: 'water' },
    ],
  },
}

describe('usePersistentCalculator', () => {
  it('restores a valid session and persists calculator mutations', async () => {
    const storage = new MemoryStorage()
    saveSession(savedSession, storage)
    const { result } = renderHook(() => usePersistentCalculator(storage))

    expect(result.current.calculator.state.mode).toBe('flour')
    expect(result.current.calculator.state.targetInput).toBe('650')
    expect(result.current.calculator.state.formula.ingredients[0].quantity).toBe(75)

    act(() => result.current.calculator.setTargetInput('700'))
    await waitFor(() => expect(loadSessionV2(storage, 'production').production.targetInput).toBe('700'))
  })

  it('saves presets as formulas only and loads them without changing mode or target', () => {
    const storage = new MemoryStorage()
    const { result } = renderHook(() => usePersistentCalculator(storage))

    act(() => result.current.calculator.setMode('flour'))
    act(() => result.current.calculator.setTargetInput('500'))
    act(() => result.current.calculator.setIngredientQuantityInput('water', '80'))
    act(() => result.current.savePreset('  Focaccia  '))

    expect(result.current.presets).toHaveLength(1)
    expect(result.current.presets[0].name).toBe('Focaccia')
    expect(loadPresetsV2(storage, 'production')[0].formula.ingredients[0].quantity).toBe(80)

    act(() => result.current.calculator.setIngredientQuantityInput('water', '60'))
    act(() => result.current.loadPreset(result.current.presets[0].id))

    expect(result.current.calculator.state.mode).toBe('flour')
    expect(result.current.calculator.state.targetInput).toBe('500')
    expect(result.current.calculator.state.formula.ingredients[0].quantity).toBe(80)
  })

  it('rejects empty names, renames, duplicates, updates and deletes presets', () => {
    const storage = new MemoryStorage()
    const { result } = renderHook(() => usePersistentCalculator(storage))

    act(() => expect(result.current.savePreset('   ')).toBe(false))
    expect(result.current.presets).toEqual([])

    act(() => result.current.savePreset('Pizza'))
    const originalId = result.current.presets[0].id

    act(() => expect(result.current.renamePreset(originalId, '  Napolitana  ')).toBe(true))
    expect(result.current.presets[0].name).toBe('Napolitana')

    act(() => result.current.duplicatePreset(originalId))
    expect(result.current.presets).toHaveLength(2)
    expect(result.current.presets[1].id).not.toBe(originalId)
    expect(result.current.presets[1].name).toContain('Napolitana')

    act(() => result.current.calculator.setIngredientQuantityInput('water', '72'))
    act(() => result.current.updatePresetFromCurrentFormula(originalId))
    expect(result.current.presets.find((preset) => preset.id === originalId)?.formula.ingredients[0].quantity).toBe(72)

    act(() => result.current.deletePreset(originalId))
    expect(result.current.presets.some((preset) => preset.id === originalId)).toBe(false)
  })

  it('exposes a non-blocking warning when storage writes fail', async () => {
    const storage = new MemoryStorage()
    storage.setItem = () => { throw new DOMException('blocked', 'QuotaExceededError') }
    const { result } = renderHook(() => usePersistentCalculator(storage))

    act(() => result.current.calculator.setTargetInput('1200'))
    await waitFor(() => expect(result.current.persistenceWarning).toBeTruthy())
    expect(result.current.calculator.state.targetInput).toBe('1200')
    expect(result.current.calculator.state.result).not.toBeNull()
  })
})


describe('V2 planner persistence', () => {
  it('persists planner target and stages in the working session', async () => {
    const storage = new MemoryStorage()
    const { result } = renderHook(() => usePersistentCalculator(storage))

    act(() => result.current.planner.setTargetDateTimeInput('2026-10-06T20:30'))
    act(() => result.current.planner.addStage())
    const stageId = result.current.planner.state.stages[0].id
    act(() => result.current.planner.setStageName(stageId, 'Bloque'))
    act(() => result.current.planner.setStageDurationHoursInput(stageId, '2'))

    await waitFor(() => {
      const persisted = loadSessionV2(storage, 'production')
      expect(persisted.planner.targetDateTimeInput).toBe('2026-10-06T20:30')
      expect(persisted.planner.stages[0]).toMatchObject({ name: 'Bloque', durationMinutes: 120 })
    })
  })
})
