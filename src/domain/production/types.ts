import type { MassUnit } from '../mass/units'

export type ProductionMode = 'totalMass' | 'flour' | 'pieces'

export type ProductionRequest =
  | {
      mode: 'totalMass'
      value: number
      unit: MassUnit
      scale: number
    }
  | {
      mode: 'flour'
      value: number
      unit: MassUnit
      scale: number
    }
  | {
      mode: 'pieces'
      count: number
      pieceMass: number
      unit: MassUnit
    }

export interface ResolvedProductionTarget {
  calculationMode: 'totalMass' | 'flour'
  targetGrams: number
  pieces?: {
    count: number
    pieceMassGrams: number
  }
}
