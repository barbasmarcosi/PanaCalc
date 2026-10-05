import { describe, expect, it } from 'vitest'
import { validateCalculation } from './validate'
import type { DoughFormula } from './types'

const formula = (overrides: DoughFormula['ingredients'] = []): DoughFormula => ({
  ingredients: overrides.length
    ? overrides
    : [{ id: 'water', name: 'Agua', quantity: 70, unit: 'percent', kind: 'water' }],
})

describe('validateCalculation', () => {
  it.each([0, -1])('rejects non-positive target %s', (target) => {
    expect(validateCalculation('flour', target, formula())).toContain('La cantidad debe ser mayor que 0 g.')
  })

  it('rejects negative percentages', () => {
    const errors = validateCalculation('flour', 500, formula([
      { id: 'water', name: 'Agua', quantity: -1, unit: 'percent', kind: 'water' },
    ]))
    expect(errors).toContain('Agua no puede tener un porcentaje negativo.')
  })

  it('rejects negative grams', () => {
    const errors = validateCalculation('flour', 500, formula([
      { id: 'oil', name: 'Aceite', quantity: -1, unit: 'grams', kind: 'custom' },
    ]))
    expect(errors).toContain('Aceite no puede tener gramos negativos.')
  })

  it('rejects blank ingredient names', () => {
    const errors = validateCalculation('flour', 500, formula([
      { id: 'x', name: '   ', quantity: 2, unit: 'percent', kind: 'custom' },
    ]))
    expect(errors).toContain('Todos los ingredientes necesitan un nombre.')
  })

  it.each([1000, 1100])('rejects fixed grams >= total target (%s)', (grams) => {
    const errors = validateCalculation('totalMass', 1000, formula([
      { id: 'water', name: 'Agua', quantity: 70, unit: 'percent', kind: 'water' },
      { id: 'oil', name: 'Aceite', quantity: grams, unit: 'grams', kind: 'custom' },
    ]))
    expect(errors).toContain('Los ingredientes fijos deben sumar menos que la masa total.')
  })

  it('allows percentages above 100', () => {
    expect(validateCalculation('flour', 500, formula([
      { id: 'water', name: 'Agua', quantity: 150, unit: 'percent', kind: 'water' },
    ]))).toEqual([])
  })
})
