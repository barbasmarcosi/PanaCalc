import { describe, expect, it } from 'vitest'
import { calculateFromFlour, calculateFromTotalMass } from './calculate'
import type { DoughFormula } from './types'

const mixedFormula: DoughFormula = {
  ingredients: [
    { id: 'water', name: 'Agua', quantity: 70, unit: 'percent', kind: 'water' },
    { id: 'salt', name: 'Sal', quantity: 2, unit: 'percent', kind: 'custom' },
    { id: 'oil', name: 'Aceite', quantity: 15, unit: 'grams', kind: 'custom' },
  ],
}

describe('dough calculations', () => {
  it('calculates every ingredient and total from flour', () => {
    const result = calculateFromFlour(600, mixedFormula)
    expect(result.flourGrams).toBe(600)
    expect(result.ingredients).toEqual([
      { id: 'water', name: 'Agua', grams: 420 },
      { id: 'salt', name: 'Sal', grams: 12 },
      { id: 'oil', name: 'Aceite', grams: 15 },
    ])
    expect(result.totalMassGrams).toBe(1047)
  })

  it('calculates flour from desired total mass with mixed units', () => {
    const result = calculateFromTotalMass(1000, mixedFormula)
    const expectedFlour = 985 / 1.72
    expect(result.flourGrams).toBeCloseTo(expectedFlour, 12)
    expect(result.ingredients[0].grams).toBeCloseTo(expectedFlour * 0.7, 12)
    expect(result.ingredients[1].grams).toBeCloseTo(expectedFlour * 0.02, 12)
    expect(result.ingredients[2].grams).toBe(15)
    expect(result.totalMassGrams).toBeCloseTo(1000, 12)
  })

  it('supports baker percentages above 100 percent', () => {
    const formula: DoughFormula = {
      ingredients: [{ id: 'water', name: 'Agua', quantity: 120, unit: 'percent', kind: 'water' }],
    }
    expect(calculateFromFlour(500, formula).ingredients[0].grams).toBe(600)
    expect(calculateFromFlour(500, formula).totalMassGrams).toBe(1100)
  })

  it('does not round intermediate values', () => {
    const formula: DoughFormula = {
      ingredients: [{ id: 'water', name: 'Agua', quantity: 66.6, unit: 'percent', kind: 'water' }],
    }
    const result = calculateFromTotalMass(1000, formula)
    expect(result.flourGrams).toBeCloseTo(1000 / 1.666, 12)
    expect(result.ingredients[0].grams).toBeCloseTo(result.flourGrams * 0.666, 12)
    expect(result.totalMassGrams).toBeCloseTo(1000, 12)
  })
})
