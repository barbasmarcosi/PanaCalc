import type { DoughFormula, Preferment, PrefermentBreakdown } from './types'

export function calculatePrefermentBreakdown(
  flourGrams: number,
  waterGrams: number,
  preferments: Preferment[],
): PrefermentBreakdown {
  const calculated = preferments.map((preferment) => {
    const prefermentFlour = flourGrams * preferment.flourPercent / 100
    const prefermentWater = prefermentFlour * preferment.hydrationPercent / 100

    return {
      id: preferment.id,
      name: preferment.name,
      flourGrams: prefermentFlour,
      waterGrams: prefermentWater,
      totalGrams: prefermentFlour + prefermentWater,
    }
  })

  return {
    preferments: calculated,
    finalMixFlourGrams: flourGrams - calculated.reduce((sum, item) => sum + item.flourGrams, 0),
    finalMixWaterGrams: waterGrams - calculated.reduce((sum, item) => sum + item.waterGrams, 0),
  }
}

export function validatePreferments(formula: DoughFormula): string[] {
  const preferments = formula.preferments ?? []
  const errors: string[] = []

  if (preferments.some((preferment) => !preferment.name.trim())) {
    errors.push('Todos los prefermentos necesitan un nombre.')
  }

  for (const preferment of preferments) {
    if (!Number.isFinite(preferment.flourPercent) || preferment.flourPercent < 0) {
      errors.push('El porcentaje de harina del prefermento debe ser un número no negativo.')
    }

    if (!Number.isFinite(preferment.hydrationPercent) || preferment.hydrationPercent < 0) {
      errors.push('La hidratación del prefermento debe ser un número no negativo.')
    }
  }

  const validPreferments = preferments.filter((preferment) => (
    Number.isFinite(preferment.flourPercent)
      && preferment.flourPercent >= 0
      && Number.isFinite(preferment.hydrationPercent)
      && preferment.hydrationPercent >= 0
  ))

  const totalFlourPercent = validPreferments.reduce((sum, preferment) => sum + preferment.flourPercent, 0)
  if (totalFlourPercent > 100) {
    errors.push('Los prefermentos no pueden usar más del 100% de la harina total.')
  }

  const waterIngredient = formula.ingredients.find((ingredient) => ingredient.kind === 'water')
  const totalWaterPercent = waterIngredient?.unit === 'percent' && Number.isFinite(waterIngredient.quantity)
    ? waterIngredient.quantity
    : 0
  const prefermentWaterPercent = validPreferments.reduce(
    (sum, preferment) => sum + preferment.flourPercent * preferment.hydrationPercent / 100,
    0,
  )

  if (prefermentWaterPercent > totalWaterPercent) {
    errors.push('Los prefermentos no pueden usar más agua que la fórmula total.')
  }

  return errors
}
