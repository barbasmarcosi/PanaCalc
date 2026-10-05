let fallbackCounter = 0

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  fallbackCounter += 1
  return `ingredient-${Date.now().toString(36)}-${fallbackCounter.toString(36)}`
}
