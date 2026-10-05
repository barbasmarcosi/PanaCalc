export type IngredientUnit = 'percent' | 'grams'

export interface FormulaIngredient {
  id: string
  name: string
  quantity: number
  unit: IngredientUnit
  kind: 'water' | 'custom'
}

export interface DoughFormula {
  ingredients: FormulaIngredient[]
}

export interface IngredientResult {
  id: string
  name: string
  grams: number
}

export interface DoughResult {
  flourGrams: number
  ingredients: IngredientResult[]
  totalMassGrams: number
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
}
