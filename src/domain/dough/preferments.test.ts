import { describe, expect, it } from 'vitest'
import { calculateFromFlour } from './calculate'
import { calculatePrefermentBreakdown, validatePreferments } from './preferments'
import type { DoughFormula } from './types'

function formula(
  hydration: number,
  preferments: Array<{ id: string; name: string; flourPercent: number; hydrationPercent: number }>,
): DoughFormula {
  return {
    ingredients: [
      { id: 'water', name: 'Agua', quantity: hydration, unit: 'percent', kind: 'water' },
    ],
    preferments,
  }
}

describe('calculatePrefermentBreakdown', () => {
  it('partitions a 20 percent 100 percent hydration poolish', () => {
    expect(calculatePrefermentBreakdown(1000, 700, [
      { id: 'poolish', name: 'Poolish', flourPercent: 20, hydrationPercent: 100 },
    ])).toEqual({
      preferments: [
        { id: 'poolish', name: 'Poolish', flourGrams: 200, waterGrams: 200, totalGrams: 400 },
      ],
      finalMixFlourGrams: 800,
      finalMixWaterGrams: 500,
    })
  })

  it('partitions a lower hydration biga', () => {
    expect(calculatePrefermentBreakdown(1000, 700, [
      { id: 'biga', name: 'Biga', flourPercent: 20, hydrationPercent: 50 },
    ])).toEqual({
      preferments: [
        { id: 'biga', name: 'Biga', flourGrams: 200, waterGrams: 100, totalGrams: 300 },
      ],
      finalMixFlourGrams: 800,
      finalMixWaterGrams: 600,
    })
  })

  it('supports multiple preferments without double counting', () => {
    const result = calculatePrefermentBreakdown(1000, 700, [
      { id: 'poolish', name: 'Poolish', flourPercent: 20, hydrationPercent: 100 },
      { id: 'biga', name: 'Biga', flourPercent: 10, hydrationPercent: 50 },
    ])

    expect(result.preferments).toEqual([
      { id: 'poolish', name: 'Poolish', flourGrams: 200, waterGrams: 200, totalGrams: 400 },
      { id: 'biga', name: 'Biga', flourGrams: 100, waterGrams: 50, totalGrams: 150 },
    ])
    expect(result.finalMixFlourGrams).toBe(700)
    expect(result.finalMixWaterGrams).toBe(450)
  })

  it('does not add preferment mass to dough total', () => {
    const result = calculateFromFlour(1000, formula(70, [
      { id: 'poolish', name: 'Poolish', flourPercent: 20, hydrationPercent: 100 },
    ]))
    expect(result.totalMassGrams).toBe(1700)
    expect(result.prefermentBreakdown.finalMixFlourGrams).toBe(800)
    expect(result.prefermentBreakdown.finalMixWaterGrams).toBe(500)
  })
})

describe('validatePreferments', () => {
  it('rejects combined flour share above 100 percent', () => {
    expect(validatePreferments(formula(70, [
      { id: 'one', name: 'Uno', flourPercent: 60, hydrationPercent: 50 },
      { id: 'two', name: 'Dos', flourPercent: 50, hydrationPercent: 50 },
    ]))).toContain('Los prefermentos no pueden usar más del 100% de la harina total.')
  })

  it('rejects preferments that consume more water than the formula contains', () => {
    expect(validatePreferments(formula(20, [
      { id: 'poolish', name: 'Poolish', flourPercent: 30, hydrationPercent: 100 },
    ]))).toContain('Los prefermentos no pueden usar más agua que la fórmula total.')
  })

  it('rejects blank names and negative or non-finite percentages', () => {
    const errors = validatePreferments(formula(70, [
      { id: 'bad', name: '   ', flourPercent: -1, hydrationPercent: Number.NaN },
    ]))
    expect(errors).toContain('Todos los prefermentos necesitan un nombre.')
    expect(errors).toContain('El porcentaje de harina del prefermento debe ser un número no negativo.')
    expect(errors).toContain('La hidratación del prefermento debe ser un número no negativo.')
  })
})
