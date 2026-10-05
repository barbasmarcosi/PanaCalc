import { describe, expect, it } from 'vitest'
import { calculateFromTotalMass } from '../dough/calculate'
import type { DoughFormula } from '../dough/types'
import { resolveProductionTarget, validateProductionRequest } from './resolve'

const mixedFormula: DoughFormula = {
  ingredients: [
    { id: 'water', name: 'Agua', quantity: 70, unit: 'percent', kind: 'water' },
    { id: 'salt', name: 'Sal', quantity: 2, unit: 'percent', kind: 'custom' },
    { id: 'oil', name: 'Aceite', quantity: 15, unit: 'grams', kind: 'custom' },
  ],
}

describe('resolveProductionTarget', () => {
  it('resolves scaled total mass in any supported unit', () => {
    expect(resolveProductionTarget({ mode: 'totalMass', value: 2.5, unit: 'kg', scale: 2 }))
      .toEqual({ calculationMode: 'totalMass', targetGrams: 5000 })
  })

  it('resolves scaled flour mass', () => {
    expect(resolveProductionTarget({ mode: 'flour', value: 3, unit: 'lb', scale: 0.5 }))
      .toEqual({ calculationMode: 'flour', targetGrams: 680.388555 })
  })

  it('derives total dough from piece count and piece mass', () => {
    expect(resolveProductionTarget({ mode: 'pieces', count: 6, pieceMass: 280, unit: 'g' }))
      .toEqual({
        calculationMode: 'totalMass',
        targetGrams: 1680,
        pieces: { count: 6, pieceMassGrams: 280 },
      })
  })

  it('supports imperial piece weights', () => {
    expect(resolveProductionTarget({ mode: 'pieces', count: 4, pieceMass: 0.5, unit: 'lb' }).targetGrams)
      .toBeCloseTo(907.18474, 12)
  })

  it('scales the total target while fixed gram ingredients remain fixed', () => {
    const resolved = resolveProductionTarget({ mode: 'totalMass', value: 1000, unit: 'g', scale: 2 })
    const result = calculateFromTotalMass(resolved.targetGrams, mixedFormula)
    expect(result.ingredients.find((ingredient) => ingredient.id === 'oil')?.grams).toBe(15)
    expect(result.totalMassGrams).toBeCloseTo(2000, 12)
  })
})

describe('validateProductionRequest', () => {
  it('rejects fractional piece counts instead of rounding them', () => {
    expect(validateProductionRequest({ mode: 'pieces', count: 2.5, pieceMass: 280, unit: 'g' }))
      .toContain('La cantidad de piezas debe ser un entero mayor que 0.')
  })

  it.each([0, -1, Number.NaN])('rejects invalid piece count %s', (count) => {
    expect(validateProductionRequest({ mode: 'pieces', count, pieceMass: 280, unit: 'g' }))
      .toContain('La cantidad de piezas debe ser un entero mayor que 0.')
  })

  it.each([0, -1, Number.NaN])('rejects invalid piece mass %s', (pieceMass) => {
    expect(validateProductionRequest({ mode: 'pieces', count: 6, pieceMass, unit: 'g' }))
      .toContain('El peso por pieza debe ser mayor que 0.')
  })

  it.each([0, -1, Number.NaN])('rejects invalid scale %s', (scale) => {
    expect(validateProductionRequest({ mode: 'totalMass', value: 1000, unit: 'g', scale }))
      .toContain('El multiplicador debe ser mayor que 0.')
  })

  it('rejects a non-positive production amount', () => {
    expect(validateProductionRequest({ mode: 'flour', value: 0, unit: 'kg', scale: 1 }))
      .toContain('La cantidad debe ser mayor que 0.')
  })
})
