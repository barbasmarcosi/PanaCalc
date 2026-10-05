import type { DoughFormula } from '../domain/dough/types'
import type { MassUnit } from '../domain/mass/units'
import type { PlannerState } from '../domain/planner/types'
import type { ProductionMode } from '../domain/production/types'

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

export interface ProductionStateV2 {
  mode: ProductionMode
  targetInput: string
  targetUnit: MassUnit
  pieceCountInput: string
  pieceMassInput: string
  pieceMassUnit: MassUnit
  scaleMultiplierInput: string
  resultUnit: MassUnit
}

export interface CalculatorSessionV2 {
  production: ProductionStateV2
  formula: DoughFormula
  planner: PlannerState
}

export interface FormulaPresetV2 extends FormulaPreset {
  favorite: boolean
  category: string | null
}
