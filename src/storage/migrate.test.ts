import { describe, expect, it } from 'vitest'
import { migrateV1Preset, migrateV1Session } from './migrate'

describe('V1 to V2 migration', () => {
  it('migrates a V1 session without changing formula meaning', () => {
    const migrated = migrateV1Session({
      mode: 'flour',
      targetInput: '650',
      formula: {
        ingredients: [
          { id: 'water', name: 'Agua', quantity: 75, unit: 'percent', kind: 'water' },
          { id: 'oil', name: 'Aceite', quantity: 15, unit: 'grams', kind: 'custom' },
        ],
      },
    })

    expect(migrated.production).toMatchObject({
      mode: 'flour',
      targetInput: '650',
      targetUnit: 'g',
      scaleMultiplierInput: '1',
      resultUnit: 'g',
    })
    expect(migrated.formula.preferments).toEqual([])
    expect(migrated.formula.ingredients[0].massUnit).toBeUndefined()
    expect(migrated.formula.ingredients[1]).toMatchObject({
      quantity: 15,
      unit: 'grams',
      massUnit: 'g',
    })
    expect(migrated.planner).toEqual({ targetDateTimeInput: '', stages: [] })
  })

  it('adds V2 preset metadata with neutral defaults', () => {
    const migrated = migrateV1Preset({
      id: 'pizza',
      name: 'Pizza',
      formula: {
        ingredients: [
          { id: 'water', name: 'Agua', quantity: 70, unit: 'percent', kind: 'water' },
        ],
      },
      createdAt: '2026-10-05T00:00:00.000Z',
      updatedAt: '2026-10-05T00:00:00.000Z',
    })

    expect(migrated.favorite).toBe(false)
    expect(migrated.category).toBeNull()
    expect(migrated.formula.preferments).toEqual([])
  })
})
