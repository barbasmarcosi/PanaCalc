import type { DoughFormula } from '../domain/dough/types'
import type {
  CalculatorSession,
  CalculatorSessionV2,
  FormulaPreset,
  FormulaPresetV2,
} from './types'

export function migrateV1Formula(formula: DoughFormula): DoughFormula {
  return {
    ingredients: formula.ingredients.map((ingredient) => (
      ingredient.unit === 'grams'
        ? { ...ingredient, massUnit: 'g' as const }
        : { ...ingredient, massUnit: undefined }
    )),
    preferments: [],
  }
}

export function migrateV1Session(session: CalculatorSession): CalculatorSessionV2 {
  return {
    production: {
      mode: session.mode,
      targetInput: session.targetInput,
      targetUnit: 'g',
      pieceCountInput: '6',
      pieceMassInput: '280',
      pieceMassUnit: 'g',
      scaleMultiplierInput: '1',
      resultUnit: 'g',
    },
    formula: migrateV1Formula(session.formula),
    planner: {
      targetDateTimeInput: '',
      stages: [],
    },
  }
}

export function migrateV1Preset(preset: FormulaPreset): FormulaPresetV2 {
  return {
    ...preset,
    formula: migrateV1Formula(preset.formula),
    favorite: false,
    category: null,
  }
}
