import { useMemo, useState } from 'react'
import { calculateFromFlour, calculateFromTotalMass } from '../domain/dough/calculate'
import { parseDecimalInput } from '../domain/dough/numbers'
import type { DoughFormula, DoughResult, IngredientUnit } from '../domain/dough/types'
import { validateCalculation } from '../domain/dough/validate'
import {
  formatEditableMass,
  toGrams,
  type MassUnit,
} from '../domain/mass/units'
import {
  resolveProductionTarget,
  validateProductionRequest,
} from '../domain/production/resolve'
import type { ProductionMode, ProductionRequest } from '../domain/production/types'
import { DEFAULT_SESSION_V2 } from '../storage/localStorage'
import type { CalculatorSessionV2 } from '../storage/types'
import { createId } from './id'

export interface CalculatorViewState {
  mode: ProductionMode
  targetInput: string
  targetUnit: MassUnit
  pieceCountInput: string
  pieceMassInput: string
  pieceMassUnit: MassUnit
  scaleMultiplierInput: string
  resultUnit: MassUnit
  formula: DoughFormula
  quantityInputs: Record<string, string>
  prefermentFlourInputs: Record<string, string>
  prefermentHydrationInputs: Record<string, string>
  result: DoughResult | null
  errors: string[]
}

function cloneFormula(formula: DoughFormula): DoughFormula {
  return {
    ingredients: formula.ingredients.map((ingredient) => (
      ingredient.unit === 'grams'
        ? { ...ingredient, massUnit: ingredient.massUnit ?? 'g' }
        : { ...ingredient, massUnit: undefined }
    )),
    preferments: formula.preferments?.map((preferment) => ({ ...preferment })),
  }
}

function buildQuantityInputs(formula: DoughFormula): Record<string, string> {
  return Object.fromEntries(formula.ingredients.map((ingredient) => [
    ingredient.id,
    ingredient.unit === 'grams'
      ? formatEditableMass(ingredient.quantity, ingredient.massUnit ?? 'g')
      : String(ingredient.quantity),
  ]))
}

function buildPrefermentInputs(formula: DoughFormula) {
  const preferments = formula.preferments ?? []
  return {
    flour: Object.fromEntries(preferments.map((preferment) => [preferment.id, String(preferment.flourPercent)])),
    hydration: Object.fromEntries(preferments.map((preferment) => [preferment.id, String(preferment.hydrationPercent)])),
  }
}

export function useCalculator(initialSession: CalculatorSessionV2 = DEFAULT_SESSION_V2) {
  const [mode, setMode] = useState<ProductionMode>(initialSession.production.mode)
  const [targetInput, setTargetInput] = useState(initialSession.production.targetInput)
  const [targetUnit, setTargetUnitState] = useState<MassUnit>(initialSession.production.targetUnit)
  const [pieceCountInput, setPieceCountInput] = useState(initialSession.production.pieceCountInput)
  const [pieceMassInput, setPieceMassInput] = useState(initialSession.production.pieceMassInput)
  const [pieceMassUnit, setPieceMassUnitState] = useState<MassUnit>(initialSession.production.pieceMassUnit)
  const [scaleMultiplierInput, setScaleMultiplierInput] = useState(initialSession.production.scaleMultiplierInput)
  const [resultUnit, setResultUnit] = useState<MassUnit>(initialSession.production.resultUnit)
  const [formula, setFormula] = useState<DoughFormula>(() => cloneFormula(initialSession.formula))
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>(() => buildQuantityInputs(initialSession.formula))
  const initialPrefermentInputs = buildPrefermentInputs(initialSession.formula)
  const [prefermentFlourInputs, setPrefermentFlourInputs] = useState<Record<string, string>>(initialPrefermentInputs.flour)
  const [prefermentHydrationInputs, setPrefermentHydrationInputs] = useState<Record<string, string>>(initialPrefermentInputs.hydration)

  const state = useMemo<CalculatorViewState>(() => {
    const errors: string[] = []

    for (const ingredient of formula.ingredients) {
      if (parseDecimalInput(quantityInputs[ingredient.id] ?? '') === null) {
        errors.push(`Ingresá una cantidad válida para ${ingredient.name.trim() || 'el ingrediente'}.`)
      }
    }

    for (const preferment of formula.preferments ?? []) {
      const name = preferment.name.trim() || 'Prefermento'
      if (parseDecimalInput(prefermentFlourInputs[preferment.id] ?? '') === null) {
        errors.push(`Ingresá un porcentaje de harina válido para ${name}.`)
      }
      if (parseDecimalInput(prefermentHydrationInputs[preferment.id] ?? '') === null) {
        errors.push(`Ingresá una hidratación válida para ${name}.`)
      }
    }

    let request: ProductionRequest | null = null

    if (mode === 'pieces') {
      const count = parseDecimalInput(pieceCountInput)
      const pieceMass = parseDecimalInput(pieceMassInput)

      if (count === null) errors.push('Ingresá una cantidad válida de piezas.')
      if (pieceMass === null) errors.push('Ingresá un peso por pieza válido.')

      if (count !== null && pieceMass !== null) {
        request = { mode, count, pieceMass, unit: pieceMassUnit }
      }
    } else {
      const target = parseDecimalInput(targetInput)
      const scale = parseDecimalInput(scaleMultiplierInput)

      if (target === null) errors.push('Ingresá una cantidad válida.')
      if (scale === null) errors.push('Ingresá un multiplicador válido.')

      if (target !== null && scale !== null) {
        request = { mode, value: target, unit: targetUnit, scale }
      }
    }

    if (!request || errors.length > 0) {
      return {
        mode,
        targetInput,
        targetUnit,
        pieceCountInput,
        pieceMassInput,
        pieceMassUnit,
        scaleMultiplierInput,
        resultUnit,
        formula,
        quantityInputs,
        prefermentFlourInputs,
        prefermentHydrationInputs,
        result: null,
        errors,
      }
    }

    errors.push(...validateProductionRequest(request))
    if (errors.length > 0) {
      return {
        mode,
        targetInput,
        targetUnit,
        pieceCountInput,
        pieceMassInput,
        pieceMassUnit,
        scaleMultiplierInput,
        resultUnit,
        formula,
        quantityInputs,
        prefermentFlourInputs,
        prefermentHydrationInputs,
        result: null,
        errors,
      }
    }

    const resolved = resolveProductionTarget(request)
    errors.push(...validateCalculation(resolved.calculationMode, resolved.targetGrams, formula))

    if (errors.length > 0) {
      return {
        mode,
        targetInput,
        targetUnit,
        pieceCountInput,
        pieceMassInput,
        pieceMassUnit,
        scaleMultiplierInput,
        resultUnit,
        formula,
        quantityInputs,
        prefermentFlourInputs,
        prefermentHydrationInputs,
        result: null,
        errors,
      }
    }

    const result = resolved.calculationMode === 'flour'
      ? calculateFromFlour(resolved.targetGrams, formula)
      : calculateFromTotalMass(resolved.targetGrams, formula)

    return {
      mode,
      targetInput,
      targetUnit,
      pieceCountInput,
      pieceMassInput,
      pieceMassUnit,
      scaleMultiplierInput,
      resultUnit,
      formula,
      quantityInputs,
      prefermentFlourInputs,
      prefermentHydrationInputs,
      result,
      errors,
    }
  }, [
    formula,
    mode,
    pieceCountInput,
    pieceMassInput,
    pieceMassUnit,
    prefermentFlourInputs,
    prefermentHydrationInputs,
    quantityInputs,
    resultUnit,
    scaleMultiplierInput,
    targetInput,
    targetUnit,
  ])

  function setTargetUnit(unit: MassUnit) {
    setTargetInput((current) => {
      const parsed = parseDecimalInput(current)
      return parsed === null
        ? current
        : formatEditableMass(toGrams(parsed, targetUnit), unit)
    })
    setTargetUnitState(unit)
  }

  function setPieceMassUnit(unit: MassUnit) {
    setPieceMassInput((current) => {
      const parsed = parseDecimalInput(current)
      return parsed === null
        ? current
        : formatEditableMass(toGrams(parsed, pieceMassUnit), unit)
    })
    setPieceMassUnitState(unit)
  }

  function setIngredientName(id: string, name: string) {
    setFormula((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient) => (
        ingredient.id === id ? { ...ingredient, name } : ingredient
      )),
    }))
  }

  function setIngredientQuantityInput(id: string, value: string) {
    setQuantityInputs((current) => ({ ...current, [id]: value }))
    const parsed = parseDecimalInput(value)
    if (parsed === null) return

    setFormula((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient) => (
        ingredient.id === id
          ? {
              ...ingredient,
              quantity: ingredient.unit === 'grams'
                ? toGrams(parsed, ingredient.massUnit ?? 'g')
                : parsed,
            }
          : ingredient
      )),
    }))
  }

  function setIngredientUnit(id: string, unit: IngredientUnit) {
    const parsedInput = parseDecimalInput(quantityInputs[id] ?? '')

    setFormula((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient) => {
        if (ingredient.id !== id || ingredient.kind === 'water') return ingredient

        if (unit === 'grams') {
          return {
            ...ingredient,
            unit,
            massUnit: 'g',
            quantity: parsedInput ?? ingredient.quantity,
          }
        }

        return {
          ...ingredient,
          unit,
          massUnit: undefined,
          quantity: parsedInput ?? ingredient.quantity,
        }
      }),
    }))
  }

  function setIngredientMassUnit(id: string, unit: MassUnit) {
    const ingredient = formula.ingredients.find((item) => item.id === id)
    if (!ingredient || ingredient.kind === 'water') return

    if (ingredient.unit === 'percent') {
      const parsedInput = parseDecimalInput(quantityInputs[id] ?? '')
      setFormula((current) => ({
        ...current,
        ingredients: current.ingredients.map((item) => (
          item.id === id
            ? {
                ...item,
                unit: 'grams',
                massUnit: unit,
                quantity: parsedInput === null ? item.quantity : toGrams(parsedInput, unit),
              }
            : item
        )),
      }))
      return
    }

    setQuantityInputs((current) => ({
      ...current,
      [id]: formatEditableMass(ingredient.quantity, unit),
    }))

    setFormula((current) => ({
      ...current,
      ingredients: current.ingredients.map((item) => (
        item.id === id ? { ...item, massUnit: unit } : item
      )),
    }))
  }

  function addPreferment() {
    const id = createId()
    setFormula((current) => ({
      ...current,
      preferments: [
        ...(current.preferments ?? []),
        { id, name: 'Prefermento', flourPercent: 20, hydrationPercent: 100 },
      ],
    }))
    setPrefermentFlourInputs((current) => ({ ...current, [id]: '20' }))
    setPrefermentHydrationInputs((current) => ({ ...current, [id]: '100' }))
  }

  function removePreferment(id: string) {
    setFormula((current) => ({
      ...current,
      preferments: (current.preferments ?? []).filter((preferment) => preferment.id !== id),
    }))
    setPrefermentFlourInputs((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    setPrefermentHydrationInputs((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  function setPrefermentName(id: string, name: string) {
    setFormula((current) => ({
      ...current,
      preferments: (current.preferments ?? []).map((preferment) => (
        preferment.id === id ? { ...preferment, name } : preferment
      )),
    }))
  }

  function setPrefermentFlourPercentInput(id: string, value: string) {
    setPrefermentFlourInputs((current) => ({ ...current, [id]: value }))
    const parsed = parseDecimalInput(value)
    if (parsed === null) return
    setFormula((current) => ({
      ...current,
      preferments: (current.preferments ?? []).map((preferment) => (
        preferment.id === id ? { ...preferment, flourPercent: parsed } : preferment
      )),
    }))
  }

  function setPrefermentHydrationPercentInput(id: string, value: string) {
    setPrefermentHydrationInputs((current) => ({ ...current, [id]: value }))
    const parsed = parseDecimalInput(value)
    if (parsed === null) return
    setFormula((current) => ({
      ...current,
      preferments: (current.preferments ?? []).map((preferment) => (
        preferment.id === id ? { ...preferment, hydrationPercent: parsed } : preferment
      )),
    }))
  }

  function addIngredient() {
    const id = createId()
    setFormula((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        { id, name: 'Ingrediente', quantity: 0, unit: 'percent', kind: 'custom' },
      ],
    }))
    setQuantityInputs((current) => ({ ...current, [id]: '0' }))
  }

  function removeIngredient(id: string) {
    const ingredient = formula.ingredients.find((item) => item.id === id)
    if (!ingredient || ingredient.kind === 'water') return

    setFormula((current) => ({
      ...current,
      ingredients: current.ingredients.filter((item) => item.id !== id),
    }))
    setQuantityInputs((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  function replaceFormula(nextFormula: DoughFormula) {
    const cloned = cloneFormula(nextFormula)
    const prefermentInputs = buildPrefermentInputs(cloned)
    setFormula(cloned)
    setQuantityInputs(buildQuantityInputs(cloned))
    setPrefermentFlourInputs(prefermentInputs.flour)
    setPrefermentHydrationInputs(prefermentInputs.hydration)
  }

  return {
    state,
    setMode,
    setTargetInput,
    setTargetUnit,
    setPieceCountInput,
    setPieceMassInput,
    setPieceMassUnit,
    setScaleMultiplierInput,
    setResultUnit,
    setIngredientName,
    setIngredientQuantityInput,
    setIngredientUnit,
    setIngredientMassUnit,
    addPreferment,
    removePreferment,
    setPrefermentName,
    setPrefermentFlourPercentInput,
    setPrefermentHydrationPercentInput,
    addIngredient,
    removeIngredient,
    replaceFormula,
  }
}
