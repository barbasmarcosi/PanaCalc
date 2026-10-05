import type { MassUnit } from '../mass/units'

export type IngredientUnit = 'percent' | 'grams'

export interface FormulaIngredient {
  id: string
  name: string
  quantity: number
  unit: IngredientUnit
  kind: 'water' | 'custom'
  massUnit?: MassUnit
}

export interface Preferment {
  id: string
  name: string
  flourPercent: number
  hydrationPercent: number
}

export interface DoughFormula {
  ingredients: FormulaIngredient[]
  preferments?: Preferment[]
}

export interface IngredientResult {
  id: string
  name: string
  grams: number
}

export interface PrefermentResult {
  id: string
  name: string
  flourGrams: number
  waterGrams: number
  totalGrams: number
}

export interface PrefermentBreakdown {
  preferments: PrefermentResult[]
  finalMixFlourGrams: number
  finalMixWaterGrams: number
}

export interface DoughResult {
  flourGrams: number
  ingredients: IngredientResult[]
  totalMassGrams: number
  prefermentBreakdown: PrefermentBreakdown
}

export const DEFAULT_FORMULA: DoughFormula = {
  ingredients: [
    {
      id: 'water',
      name: 'Agua',
      quantity: 70,
      unit: 'percent',
      kind: 'water',
    },
  ],
  preferments: [],
}
