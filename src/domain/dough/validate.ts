import type { DoughFormula } from './types'

export type CalculationMode = 'flour' | 'totalMass'

export function validateCalculation(
  mode: CalculationMode,
  targetGrams: number,
  formula: DoughFormula,
): string[] {
  const errors: string[] = []

  if (!Number.isFinite(targetGrams) || targetGrams <= 0) {
    errors.push('La cantidad debe ser mayor que 0 g.')
  }

  if (formula.ingredients.some((ingredient) => !ingredient.name.trim())) {
    errors.push('Todos los ingredientes necesitan un nombre.')
  }

  for (const ingredient of formula.ingredients) {
    if (!Number.isFinite(ingredient.quantity)) {
      errors.push(`${ingredient.name.trim() || 'El ingrediente'} necesita una cantidad válida.`)
      continue
    }

    if (ingredient.quantity < 0) {
      errors.push(
        ingredient.unit === 'percent'
          ? `${ingredient.name.trim() || 'El ingrediente'} no puede tener un porcentaje negativo.`
          : `${ingredient.name.trim() || 'El ingrediente'} no puede tener gramos negativos.`,
      )
    }
  }

  if (mode === 'totalMass' && Number.isFinite(targetGrams) && targetGrams > 0) {
    const fixedGrams = formula.ingredients
      .filter((ingredient) => ingredient.unit === 'grams' && Number.isFinite(ingredient.quantity))
      .reduce((sum, ingredient) => sum + ingredient.quantity, 0)

    if (fixedGrams >= targetGrams) {
      errors.push('Los ingredientes fijos deben sumar menos que la masa total.')
    }
  }

  return errors
}
