import type { DoughFormula } from '../domain/dough/types'

export type CalculationMode = 'totalMass' | 'flour'

export interface CalculatorSession {
  mode: CalculationMode
  targetInput: string
  formula: DoughFormula
}

export interface FormulaPreset {
  id: string
  name: string
  formula: DoughFormula
  createdAt: string
  updatedAt: string
}
