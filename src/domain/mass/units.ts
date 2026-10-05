export type MassUnit = 'g' | 'kg' | 'oz' | 'lb'

const GRAMS_PER_UNIT: Record<MassUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
}

const DISPLAY_FRACTION_DIGITS: Record<MassUnit, number> = {
  g: 1,
  kg: 3,
  oz: 2,
  lb: 3,
}

export function toGrams(value: number, unit: MassUnit): number {
  if (!Number.isFinite(value)) return Number.NaN
  return value * GRAMS_PER_UNIT[unit]
}

export function fromGrams(grams: number, unit: MassUnit): number {
  if (!Number.isFinite(grams)) return Number.NaN
  return grams / GRAMS_PER_UNIT[unit]
}

export function convertMass(value: number, from: MassUnit, to: MassUnit): number {
  if (!Number.isFinite(value)) return Number.NaN
  return fromGrams(toGrams(value, from), to)
}

export function formatMass(grams: number, unit: MassUnit, locale = 'es-AR'): string {
  const value = fromGrams(grams, unit)
  if (!Number.isFinite(value)) return ''
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: DISPLAY_FRACTION_DIGITS[unit],
    minimumFractionDigits: 0,
  }).format(value)} ${unit}`
}

export function formatEditableMass(grams: number, unit: MassUnit): string {
  const value = fromGrams(grams, unit)
  if (!Number.isFinite(value)) return ''
  return String(Number(value.toPrecision(12)))
}
