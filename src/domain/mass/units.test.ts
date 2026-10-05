import { describe, expect, it } from 'vitest'
import {
  convertMass,
  formatEditableMass,
  formatMass,
  fromGrams,
  toGrams,
} from './units'

describe('mass units', () => {
  it('uses the exact canonical conversion factors', () => {
    expect(toGrams(1, 'g')).toBe(1)
    expect(toGrams(1, 'kg')).toBe(1000)
    expect(toGrams(1, 'oz')).toBe(28.349523125)
    expect(toGrams(1, 'lb')).toBe(453.59237)

    expect(fromGrams(1000, 'kg')).toBe(1)
    expect(fromGrams(28.349523125, 'oz')).toBe(1)
    expect(fromGrams(453.59237, 'lb')).toBe(1)
  })

  it('converts pounds to ounces without losing physical quantity', () => {
    expect(convertMass(1, 'lb', 'oz')).toBeCloseTo(16, 12)
  })

  it('round trips mass within numeric precision', () => {
    const pounds = convertMass(2.5, 'kg', 'lb')
    expect(convertMass(pounds, 'lb', 'kg')).toBeCloseTo(2.5, 12)
  })

  it('preserves editable values without floating point noise', () => {
    expect(formatEditableMass(453.59237, 'lb')).toBe('1')
    expect(formatEditableMass(453.59237, 'oz')).toBe('16')
    expect(formatEditableMass(2500, 'kg')).toBe('2.5')
  })

  it('formats result mass with unit-specific display precision', () => {
    expect(formatMass(1234.56, 'g', 'es-AR')).toBe('1.234,6 g')
    expect(formatMass(1234.56, 'kg', 'es-AR')).toBe('1,235 kg')
    expect(formatMass(453.59237, 'lb', 'es-AR')).toBe('1 lb')
    expect(formatMass(453.59237, 'oz', 'es-AR')).toBe('16 oz')
  })

  it('returns NaN for non-finite conversion inputs', () => {
    expect(toGrams(Number.NaN, 'g')).toBeNaN()
    expect(fromGrams(Number.POSITIVE_INFINITY, 'kg')).toBeNaN()
    expect(convertMass(Number.NEGATIVE_INFINITY, 'lb', 'g')).toBeNaN()
  })
})
