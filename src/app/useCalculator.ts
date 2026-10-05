import { useMemo, useState } from 'react'
import { calculateFromFlour, calculateFromTotalMass } from '../domain/dough/calculate'
import { parseDecimalInput } from '../domain/dough/numbers'
import type { DoughFormula, DoughResult, IngredientUnit } from '../domain/dough/types'
import { validateCalculation } from '../domain/dough/validate'
import { DEFAULT_SESSION } from '../storage/localStorage'
import type { CalculationMode, CalculatorSession } from '../storage/types'
import { createId } from './id'

export interface CalculatorViewState {
  mode: CalculationMode
  targetInput: string
  formula: DoughFormula
  quantityInputs: Record<string, string>
  result: DoughResult | null
  errors: string[]
}

function cloneFormula(formula: DoughFormula): DoughFormula {
  return { ingredients: formula.ingredients.map((ingredient) => ({ ...ingredient })) }
}

function buildQuantityInputs(formula: DoughFormula): Record<string, string> {
  return Object.fromEntries(formula.ingredients.map((ingredient) => [ingredient.id, String(ingredient.quantity)]))
}

export function useCalculator(initialSession: CalculatorSession = DEFAULT_SESSION) {
  const [mode, setMode] = useState<CalculationMode>(initialSession.mode)
  const [targetInput, setTargetInput] = useState(initialSession.targetInput)
  const [formula, setFormula] = useState<DoughFormula>(() => cloneFormula(initialSession.formula))
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>(() => buildQuantityInputs(initialSession.formula))

  const state = useMemo<CalculatorViewState>(() => {
    const errors: string[] = []
    const targetGrams = parseDecimalInput(targetInput)

    if (targetGrams === null) {
      errors.push('Ingresá una cantidad válida.')
    }

    for (const ingredient of formula.ingredients) {
      if (parseDecimalInput(quantityInputs[ingredient.id] ?? '') === null) {
        errors.push(`Ingresá una cantidad válida para ${ingredient.name.trim() || 'el ingrediente'}.`)
      }
    }

    if (targetGrams === null || errors.length > 0) {
      return { mode, targetInput, formula, quantityInputs, result: null, errors }
    }

    errors.push(...validateCalculation(mode, targetGrams, formula))
    if (errors.length > 0) {
      return { mode, targetInput, formula, quantityInputs, result: null, errors }
    }

    const result = mode === 'flour'
      ? calculateFromFlour(targetGrams, formula)
      : calculateFromTotalMass(targetGrams, formula)

    return { mode, targetInput, formula, quantityInputs, result, errors }
  }, [formula, mode, quantityInputs, targetInput])

  function setIngredientName(id: string, name: string) {
    setFormula((current) => ({
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
      ingredients: current.ingredients.map((ingredient) => (
        ingredient.id === id ? { ...ingredient, quantity: parsed } : ingredient
      )),
    }))
  }

  function setIngredientUnit(id: string, unit: IngredientUnit) {
    setFormula((current) => ({
      ingredients: current.ingredients.map((ingredient) => (
        ingredient.id === id && ingredient.kind !== 'water'
          ? { ...ingredient, unit }
          : ingredient
      )),
    }))
  }

  function addIngredient() {
    const id = createId()
    setFormula((current) => ({
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
    setFormula(cloned)
    setQuantityInputs(buildQuantityInputs(cloned))
  }

  return {
    state,
    setMode,
    setTargetInput,
    setIngredientName,
    setIngredientQuantityInput,
    setIngredientUnit,
    addIngredient,
    removeIngredient,
    replaceFormula,
  }
}
