import { getRuntimeChannel, type RuntimeChannel } from '../config/runtime'
import {
  DEFAULT_FORMULA,
  type DoughFormula,
  type FormulaIngredient,
  type Preferment,
} from '../domain/dough/types'
import type { MassUnit } from '../domain/mass/units'
import type { PlannerStage } from '../domain/planner/types'
import {
  getStorageKeys,
  LEGACY_PRESETS_KEY,
  LEGACY_SESSION_KEY,
} from './keys'
import { migrateV1Preset, migrateV1Session } from './migrate'
import type {
  CalculatorSession,
  CalculatorSessionV2,
  FormulaPreset,
  FormulaPresetV2,
  ProductionStateV2,
} from './types'

export const SESSION_KEY = LEGACY_SESSION_KEY
export const PRESETS_KEY = LEGACY_PRESETS_KEY
const V1_STORAGE_VERSION = 1
const V2_STORAGE_VERSION = 2

export const DEFAULT_SESSION: CalculatorSession = {
  mode: 'totalMass',
  targetInput: '1000',
  formula: cloneFormula(DEFAULT_FORMULA),
}

export const DEFAULT_SESSION_V2: CalculatorSessionV2 = {
  production: {
    mode: 'totalMass',
    targetInput: '1000',
    targetUnit: 'g',
    pieceCountInput: '6',
    pieceMassInput: '280',
    pieceMassUnit: 'g',
    scaleMultiplierInput: '1',
    resultUnit: 'g',
  },
  formula: normalizeFormulaV2(DEFAULT_FORMULA),
  planner: {
    targetDateTimeInput: '',
    stages: [],
  },
}

interface Envelope<T> {
  version: number
  data: T
}

function cloneFormula(formula: DoughFormula): DoughFormula {
  return {
    ingredients: formula.ingredients.map((ingredient) => ({ ...ingredient })),
    preferments: formula.preferments?.map((preferment) => ({ ...preferment })),
  }
}

function normalizeFormulaV2(formula: DoughFormula): DoughFormula {
  return {
    ingredients: formula.ingredients.map((ingredient) => (
      ingredient.unit === 'grams'
        ? { ...ingredient, massUnit: ingredient.massUnit ?? 'g' }
        : { ...ingredient, massUnit: undefined }
    )),
    preferments: (formula.preferments ?? []).map((preferment) => ({ ...preferment })),
  }
}

function cloneSession(session: CalculatorSession): CalculatorSession {
  return { ...session, formula: cloneFormula(session.formula) }
}

function clonePreset(preset: FormulaPreset): FormulaPreset {
  return { ...preset, formula: cloneFormula(preset.formula) }
}

function cloneSessionV2(session: CalculatorSessionV2): CalculatorSessionV2 {
  return {
    production: { ...session.production },
    formula: normalizeFormulaV2(session.formula),
    planner: {
      targetDateTimeInput: session.planner.targetDateTimeInput,
      stages: session.planner.stages.map((stage) => ({ ...stage })),
    },
  }
}

function clonePresetV2(preset: FormulaPresetV2): FormulaPresetV2 {
  return {
    ...preset,
    formula: normalizeFormulaV2(preset.formula),
  }
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

function isMassUnit(value: unknown): value is MassUnit {
  return value === 'g' || value === 'kg' || value === 'oz' || value === 'lb'
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

function isPreferment(value: unknown): value is Preferment {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.flourPercent === 'number'
    && Number.isFinite(value.flourPercent)
    && typeof value.hydrationPercent === 'number'
    && Number.isFinite(value.hydrationPercent)
}

function isFormulaV2(value: unknown): value is DoughFormula {
  if (!isFormula(value) || !isRecord(value) || !Array.isArray(value.preferments)) return false
  if (!value.preferments.every(isPreferment)) return false

  return value.ingredients.every((ingredient) => (
    ingredient.unit !== 'grams' || isMassUnit(ingredient.massUnit)
  ))
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

function isProductionV2(value: unknown): value is ProductionStateV2 {
  return isRecord(value)
    && (value.mode === 'totalMass' || value.mode === 'flour' || value.mode === 'pieces')
    && typeof value.targetInput === 'string'
    && isMassUnit(value.targetUnit)
    && typeof value.pieceCountInput === 'string'
    && typeof value.pieceMassInput === 'string'
    && isMassUnit(value.pieceMassUnit)
    && typeof value.scaleMultiplierInput === 'string'
    && isMassUnit(value.resultUnit)
}

function isPlannerStage(value: unknown): value is PlannerStage {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.durationMinutes === 'number'
    && Number.isFinite(value.durationMinutes)
}

function isSessionV2(value: unknown): value is CalculatorSessionV2 {
  return isRecord(value)
    && isProductionV2(value.production)
    && isFormulaV2(value.formula)
    && isRecord(value.planner)
    && typeof value.planner.targetDateTimeInput === 'string'
    && Array.isArray(value.planner.stages)
    && value.planner.stages.every(isPlannerStage)
}

function isPresetV2(value: unknown): value is FormulaPresetV2 {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && value.name.trim().length > 0
    && isFormulaV2(value.formula)
    && typeof value.favorite === 'boolean'
    && (value.category === null || typeof value.category === 'string')
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
}

function parseEnvelope<T>(
  raw: string | null,
  version: number,
  validate: (value: unknown) => value is T,
): T | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== version || !validate(parsed.data)) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeEnvelope<T>(
  key: string,
  version: number,
  data: T,
  storage?: Storage,
): boolean {
  const target = resolveStorage(storage)
  if (!target) return false
  try {
    const envelope: Envelope<T> = { version, data }
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
    const session = parseEnvelope(target.getItem(SESSION_KEY), V1_STORAGE_VERSION, isSession)
    return session ? cloneSession(session) : cloneSession(DEFAULT_SESSION)
  } catch {
    return cloneSession(DEFAULT_SESSION)
  }
}

export function saveSession(session: CalculatorSession, storage?: Storage): boolean {
  return writeEnvelope(SESSION_KEY, V1_STORAGE_VERSION, session, storage)
}

export function loadPresets(storage?: Storage): FormulaPreset[] {
  const target = resolveStorage(storage)
  if (!target) return []
  try {
    const presets = parseEnvelope(target.getItem(PRESETS_KEY), V1_STORAGE_VERSION, (value): value is FormulaPreset[] => (
      Array.isArray(value) && value.every(isPreset)
    ))
    return presets ? presets.map(clonePreset) : []
  } catch {
    return []
  }
}

export function savePresets(presets: FormulaPreset[], storage?: Storage): boolean {
  return writeEnvelope(PRESETS_KEY, V1_STORAGE_VERSION, presets, storage)
}

export function loadSessionV2(
  storage?: Storage,
  channel: RuntimeChannel = getRuntimeChannel(),
): CalculatorSessionV2 {
  const target = resolveStorage(storage)
  if (!target) return cloneSessionV2(DEFAULT_SESSION_V2)
  const keys = getStorageKeys(channel)

  try {
    const current = parseEnvelope(target.getItem(keys.session), V2_STORAGE_VERSION, isSessionV2)
    if (current) return cloneSessionV2(current)

    if (channel === 'preview') return cloneSessionV2(DEFAULT_SESSION_V2)

    const legacy = parseEnvelope(target.getItem(LEGACY_SESSION_KEY), V1_STORAGE_VERSION, isSession)
    if (!legacy) return cloneSessionV2(DEFAULT_SESSION_V2)

    const migrated = migrateV1Session(legacy)
    writeEnvelope(keys.session, V2_STORAGE_VERSION, migrated, target)
    return cloneSessionV2(migrated)
  } catch {
    return cloneSessionV2(DEFAULT_SESSION_V2)
  }
}

export function saveSessionV2(
  session: CalculatorSessionV2,
  storage?: Storage,
  channel: RuntimeChannel = getRuntimeChannel(),
): boolean {
  return writeEnvelope(getStorageKeys(channel).session, V2_STORAGE_VERSION, session, storage)
}

export function loadPresetsV2(
  storage?: Storage,
  channel: RuntimeChannel = getRuntimeChannel(),
): FormulaPresetV2[] {
  const target = resolveStorage(storage)
  if (!target) return []
  const keys = getStorageKeys(channel)

  try {
    const current = parseEnvelope(target.getItem(keys.presets), V2_STORAGE_VERSION, (value): value is FormulaPresetV2[] => (
      Array.isArray(value) && value.every(isPresetV2)
    ))
    if (current) return current.map(clonePresetV2)

    if (channel === 'preview') return []

    const legacy = parseEnvelope(target.getItem(LEGACY_PRESETS_KEY), V1_STORAGE_VERSION, (value): value is FormulaPreset[] => (
      Array.isArray(value) && value.every(isPreset)
    ))
    if (!legacy) return []

    const migrated = legacy.map(migrateV1Preset)
    writeEnvelope(keys.presets, V2_STORAGE_VERSION, migrated, target)
    return migrated.map(clonePresetV2)
  } catch {
    return []
  }
}

export function savePresetsV2(
  presets: FormulaPresetV2[],
  storage?: Storage,
  channel: RuntimeChannel = getRuntimeChannel(),
): boolean {
  return writeEnvelope(getStorageKeys(channel).presets, V2_STORAGE_VERSION, presets, storage)
}
