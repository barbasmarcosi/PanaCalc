import { useEffect, useRef, useState } from 'react'
import type { DoughFormula } from '../domain/dough/types'
import {
  loadPresetsV2,
  loadSessionV2,
  savePresetsV2,
  saveSessionV2,
} from '../storage/localStorage'
import type { FormulaPresetV2 } from '../storage/types'
import { createId } from './id'
import { useCalculator } from './useCalculator'

const PERSISTENCE_WARNING = 'No se pudieron guardar los cambios en este dispositivo.'

function cloneFormula(formula: DoughFormula): DoughFormula {
  return {
    ingredients: formula.ingredients.map((ingredient) => ({ ...ingredient })),
    preferments: formula.preferments?.map((preferment) => ({ ...preferment })),
  }
}

export function usePersistentCalculator(storage?: Storage) {
  const storageRef = useRef<Storage | undefined>(storage)
  const initialSessionRef = useRef(loadSessionV2(storageRef.current))
  const plannerRef = useRef(initialSessionRef.current.planner)
  const calculator = useCalculator(initialSessionRef.current)
  const [presets, setPresets] = useState<FormulaPresetV2[]>(() => loadPresetsV2(storageRef.current))
  const [persistenceWarning, setPersistenceWarning] = useState<string | null>(null)

  useEffect(() => {
    const ok = saveSessionV2({
      production: {
        mode: calculator.state.mode,
        targetInput: calculator.state.targetInput,
        targetUnit: calculator.state.targetUnit,
        pieceCountInput: calculator.state.pieceCountInput,
        pieceMassInput: calculator.state.pieceMassInput,
        pieceMassUnit: calculator.state.pieceMassUnit,
        scaleMultiplierInput: calculator.state.scaleMultiplierInput,
        resultUnit: calculator.state.resultUnit,
      },
      formula: calculator.state.formula,
      planner: plannerRef.current,
    }, storageRef.current)
    setPersistenceWarning(ok ? null : PERSISTENCE_WARNING)
  }, [
    calculator.state.formula,
    calculator.state.mode,
    calculator.state.pieceCountInput,
    calculator.state.pieceMassInput,
    calculator.state.pieceMassUnit,
    calculator.state.resultUnit,
    calculator.state.scaleMultiplierInput,
    calculator.state.targetInput,
    calculator.state.targetUnit,
  ])

  function commitPresets(next: FormulaPresetV2[]) {
    setPresets(next)
    const ok = savePresetsV2(next, storageRef.current)
    setPersistenceWarning(ok ? null : PERSISTENCE_WARNING)
    return ok
  }

  function savePreset(name: string): boolean {
    const trimmed = name.trim()
    if (!trimmed) return false

    const now = new Date().toISOString()
    const preset: FormulaPresetV2 = {
      id: createId(),
      name: trimmed,
      formula: cloneFormula(calculator.state.formula),
      favorite: false,
      category: null,
      createdAt: now,
      updatedAt: now,
    }
    commitPresets([...presets, preset])
    return true
  }

  function loadPreset(id: string): boolean {
    const preset = presets.find((item) => item.id === id)
    if (!preset) return false
    calculator.replaceFormula(cloneFormula(preset.formula))
    return true
  }

  function renamePreset(id: string, name: string): boolean {
    const trimmed = name.trim()
    if (!trimmed) return false
    const now = new Date().toISOString()
    const next = presets.map((preset) => (
      preset.id === id ? { ...preset, name: trimmed, updatedAt: now } : preset
    ))
    if (!next.some((preset) => preset.id === id)) return false
    commitPresets(next)
    return true
  }

  function duplicatePreset(id: string): boolean {
    const source = presets.find((preset) => preset.id === id)
    if (!source) return false
    const now = new Date().toISOString()
    const duplicate: FormulaPresetV2 = {
      id: createId(),
      name: `${source.name} copia`,
      formula: cloneFormula(source.formula),
      favorite: source.favorite,
      category: source.category,
      createdAt: now,
      updatedAt: now,
    }
    commitPresets([...presets, duplicate])
    return true
  }

  function deletePreset(id: string): boolean {
    if (!presets.some((preset) => preset.id === id)) return false
    commitPresets(presets.filter((preset) => preset.id !== id))
    return true
  }

  function updatePresetFromCurrentFormula(id: string): boolean {
    if (!presets.some((preset) => preset.id === id)) return false
    const now = new Date().toISOString()
    commitPresets(presets.map((preset) => (
      preset.id === id
        ? { ...preset, formula: cloneFormula(calculator.state.formula), updatedAt: now }
        : preset
    )))
    return true
  }

  return {
    calculator,
    presets,
    persistenceWarning,
    savePreset,
    loadPreset,
    renamePreset,
    duplicatePreset,
    deletePreset,
    updatePresetFromCurrentFormula,
  }
}

export type PersistentCalculatorController = ReturnType<typeof usePersistentCalculator>
