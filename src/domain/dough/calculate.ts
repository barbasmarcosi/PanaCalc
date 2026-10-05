import { calculatePrefermentBreakdown } from './preferments'
import type { DoughFormula, DoughResult } from './types'

export function calculateFromFlour(flourGrams: number, formula: DoughFormula): DoughResult {
  const ingredients = formula.ingredients.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    grams: ingredient.unit === 'percent'
      ? flourGrams * ingredient.quantity / 100
      : ingredient.quantity,
  }))

  const waterIngredient = formula.ingredients.find((ingredient) => ingredient.kind === 'water')
  const waterGrams = waterIngredient
    ? ingredients.find((ingredient) => ingredient.id === waterIngredient.id)?.grams ?? 0
    : 0

  return {
    flourGrams,
    ingredients,
    totalMassGrams: flourGrams + ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0),
    prefermentBreakdown: calculatePrefermentBreakdown(flourGrams, waterGrams, formula.preferments ?? []),
  }
}

export function calculateFromTotalMass(totalMassGrams: number, formula: DoughFormula): DoughResult {
  const fixedGrams = formula.ingredients
    .filter((ingredient) => ingredient.unit === 'grams')
    .reduce((sum, ingredient) => sum + ingredient.quantity, 0)

  const percentageRatio = formula.ingredients
    .filter((ingredient) => ingredient.unit === 'percent')
    .reduce((sum, ingredient) => sum + ingredient.quantity / 100, 0)

  const flourGrams = (totalMassGrams - fixedGrams) / (1 + percentageRatio)
  const result = calculateFromFlour(flourGrams, formula)

  return {
    ...result,
    totalMassGrams: result.flourGrams + result.ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0),
  }
}
