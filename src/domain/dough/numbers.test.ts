import { describe, expect, it } from 'vitest'
import { formatGrams, parseDecimalInput } from './numbers'

describe('parseDecimalInput', () => {
  it('accepts comma decimal separator', () => expect(parseDecimalInput('2,5')).toBe(2.5))
  it('accepts dot decimal separator', () => expect(parseDecimalInput('2.5')).toBe(2.5))
  it.each(['', '   ', 'abc', '1,2.3', '1.2.3'])('rejects malformed input %j', (value) => {
    expect(parseDecimalInput(value)).toBeNull()
  })
})

describe('formatGrams', () => {
  it('omits unnecessary decimals', () => expect(formatGrams(420, 'es-AR')).toBe('420'))
  it('shows at most one decimal', () => expect(formatGrams(587.9123, 'es-AR')).toBe('587,9'))
})
