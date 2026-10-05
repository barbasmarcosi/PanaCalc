import { DEFAULT_FORMULA, type DoughFormula, type FormulaIngredient } from '../domain/dough/types'
import type { CalculatorSession, FormulaPreset } from './types'

export const SESSION_KEY = 'panacalc.session.v1'
export const PRESETS_KEY = 'panacalc.presets.v1'
const STORAGE_VERSION = 1

export const DEFAULT_SESSION: CalculatorSession = {
  mode: 'totalMass',
  targetInput: '1000',
  formula: cloneFormula(DEFAULT_FORMULA),
}

interface Envelope<T> {
  version: number
  data: T
}

function cloneFormula(formula: DoughFormula): DoughFormula {
  return { ingredients: formula.ingredients.map((ingredient) => ({ ...ingredient })) }
}

function cloneSession(session: CalculatorSession): CalculatorSession {
  return { ...session, formula: cloneFormula(session.formula) }
}

function clonePreset(preset: FormulaPreset): FormulaPreset {
  return { ...preset, formula: cloneFormula(preset.formula) }
}

function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIngredient(value: unknown): value is FormulaIngredient {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.quantity === 'number'
    && Number.isFinite(value.quantity)
    && (value.unit === 'percent' || value.unit === 'grams')
    && (value.kind === 'water' || value.kind === 'custom')
}

function isFormula(value: unknown): value is DoughFormula {
  if (!isRecord(value) || !Array.isArray(value.ingredients)) return false
  if (!value.ingredients.every(isIngredient)) return false
  const ids = value.ingredients.map((ingredient) => ingredient.id)
  const water = value.ingredients.filter((ingredient) => ingredient.kind === 'water')
  return new Set(ids).size === ids.length
    && water.length === 1
    && water[0].unit === 'percent'
}

function isSession(value: unknown): value is CalculatorSession {
  return isRecord(value)
    && (value.mode === 'totalMass' || value.mode === 'flour')
    && typeof value.targetInput === 'string'
    && isFormula(value.formula)
}

function isPreset(value: unknown): value is FormulaPreset {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && value.name.trim().length > 0
    && isFormula(value.formula)
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
}

function parseEnvelope<T>(raw: string | null, validate: (value: unknown) => value is T): T | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION || !validate(parsed.data)) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeEnvelope<T>(key: string, data: T, storage?: Storage): boolean {
  const target = resolveStorage(storage)
  if (!target) return false
  try {
    const envelope: Envelope<T> = { version: STORAGE_VERSION, data }
    target.setItem(key, JSON.stringify(envelope))
    return true
  } catch {
    return false
  }
}

export function loadSession(storage?: Storage): CalculatorSession {
  const target = resolveStorage(storage)
  if (!target) return cloneSession(DEFAULT_SESSION)
  try {
    const session = parseEnvelope(target.getItem(SESSION_KEY), isSession)
    return session ? cloneSession(session) : cloneSession(DEFAULT_SESSION)
  } catch {
    return cloneSession(DEFAULT_SESSION)
  }
}

export function saveSession(session: CalculatorSession, storage?: Storage): boolean {
  return writeEnvelope(SESSION_KEY, session, storage)
}

export function loadPresets(storage?: Storage): FormulaPreset[] {
  const target = resolveStorage(storage)
  if (!target) return []
  try {
    const presets = parseEnvelope(target.getItem(PRESETS_KEY), (value): value is FormulaPreset[] => (
      Array.isArray(value) && value.every(isPreset)
    ))
    return presets ? presets.map(clonePreset) : []
  } catch {
    return []
  }
}

export function savePresets(presets: FormulaPreset[], storage?: Storage): boolean {
  return writeEnvelope(PRESETS_KEY, presets, storage)
}
