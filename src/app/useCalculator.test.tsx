import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCalculator } from './useCalculator'
import type { DoughFormula } from '../domain/dough/types'

describe('useCalculator', () => {
  it('starts with total mass 1000 and water at 70 percent', () => {
    const { result } = renderHook(() => useCalculator())
    expect(result.current.state.mode).toBe('totalMass')
    expect(result.current.state.targetInput).toBe('1000')
    expect(result.current.state.formula.ingredients).toHaveLength(1)
    expect(result.current.state.formula.ingredients[0]).toMatchObject({
      id: 'water', name: 'Agua', quantity: 70, unit: 'percent', kind: 'water',
    })
    expect(result.current.state.quantityInputs.water).toBe('70')
    expect(result.current.state.result?.totalMassGrams).toBeCloseTo(1000)
  })

  it('recomputes when target changes', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.setTargetInput('1700'))
    expect(result.current.state.result?.flourGrams).toBeCloseTo(1000)
  })

  it('switches mode without changing target text and reinterprets it', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.setMode('flour'))
    expect(result.current.state.targetInput).toBe('1000')
    expect(result.current.state.result?.flourGrams).toBe(1000)
    expect(result.current.state.result?.totalMassGrams).toBe(1700)
  })

  it('adds, edits, changes unit, and removes a custom ingredient', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.addIngredient())
    const custom = result.current.state.formula.ingredients.find((item) => item.kind === 'custom')
    expect(custom).toBeDefined()
    expect(custom?.unit).toBe('percent')

    act(() => result.current.setIngredientName(custom!.id, 'Aceite'))
    act(() => result.current.setIngredientQuantityInput(custom!.id, '15'))
    act(() => result.current.setIngredientUnit(custom!.id, 'grams'))
    expect(result.current.state.formula.ingredients.find((item) => item.id === custom!.id)).toMatchObject({
      name: 'Aceite', quantity: 15, unit: 'grams', kind: 'custom',
    })

    act(() => result.current.removeIngredient(custom!.id))
    expect(result.current.state.formula.ingredients.some((item) => item.id === custom!.id)).toBe(false)
  })

  it('does not remove water', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.removeIngredient('water'))
    expect(result.current.state.formula.ingredients.some((item) => item.id === 'water')).toBe(true)
  })

  it('does not switch water to absolute grams', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.setIngredientUnit('water', 'grams'))
    expect(result.current.state.formula.ingredients.find((item) => item.id === 'water')?.unit).toBe('percent')
  })

  it('replaces formula but preserves mode and target', () => {
    const { result } = renderHook(() => useCalculator())
    const formula: DoughFormula = {
      ingredients: [
        { id: 'water', name: 'Agua', quantity: 80, unit: 'percent', kind: 'water' },
        { id: 'salt', name: 'Sal', quantity: 2.5, unit: 'percent', kind: 'custom' },
      ],
    }
    act(() => result.current.setMode('flour'))
    act(() => result.current.setTargetInput('500'))
    act(() => result.current.replaceFormula(formula))

    expect(result.current.state.mode).toBe('flour')
    expect(result.current.state.targetInput).toBe('500')
    expect(result.current.state.formula).toEqual(formula)
    expect(result.current.state.quantityInputs).toEqual({ water: '80', salt: '2.5' })
  })

  it('suppresses results while a numeric input is transiently invalid', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.setIngredientQuantityInput('water', ''))
    expect(result.current.state.quantityInputs.water).toBe('')
    expect(result.current.state.formula.ingredients[0].quantity).toBe(70)
    expect(result.current.state.result).toBeNull()
    expect(result.current.state.errors).toContain('Ingresá una cantidad válida para Agua.')

    act(() => result.current.setIngredientQuantityInput('water', '75,5'))
    expect(result.current.state.formula.ingredients[0].quantity).toBe(75.5)
    expect(result.current.state.result).not.toBeNull()
  })

  it('suppresses results while target input is empty', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.setTargetInput(''))
    expect(result.current.state.result).toBeNull()
    expect(result.current.state.errors).toContain('Ingresá una cantidad válida.')
  })
})
