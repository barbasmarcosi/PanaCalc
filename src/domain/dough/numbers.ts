export function parseDecimalInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(trimmed)) {
    return null
  }

  const normalized = trimmed.replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatGrams(value: number, locale = 'es-AR'): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value)
}
