import { useEffect, useRef, useState } from 'react'
import type { DoughFormula } from '../domain/dough/types'
import {
  loadPresets,
  loadSession,
  savePresets,
  saveSession,
} from '../storage/localStorage'
import type { FormulaPreset } from '../storage/types'
import { createId } from './id'
import { useCalculator } from './useCalculator'

const PERSISTENCE_WARNING = 'No se pudieron guardar los cambios en este dispositivo.'

function cloneFormula(formula: DoughFormula): DoughFormula {
  return { ingredients: formula.ingredients.map((ingredient) => ({ ...ingredient })) }
}

export function usePersistentCalculator(storage?: Storage) {
  const storageRef = useRef<Storage | undefined>(storage)
  const initialSessionRef = useRef(loadSession(storageRef.current))
  const calculator = useCalculator(initialSessionRef.current)
  const [presets, setPresets] = useState<FormulaPreset[]>(() => loadPresets(storageRef.current))
  const [persistenceWarning, setPersistenceWarning] = useState<string | null>(null)

  useEffect(() => {
    const ok = saveSession({
      mode: calculator.state.mode,
      targetInput: calculator.state.targetInput,
      formula: calculator.state.formula,
    }, storageRef.current)
    setPersistenceWarning(ok ? null : PERSISTENCE_WARNING)
  }, [calculator.state.formula, calculator.state.mode, calculator.state.targetInput])

  function commitPresets(next: FormulaPreset[]) {
    setPresets(next)
    const ok = savePresets(next, storageRef.current)
    setPersistenceWarning(ok ? null : PERSISTENCE_WARNING)
    return ok
  }

  function savePreset(name: string): boolean {
    const trimmed = name.trim()
    if (!trimmed) return false

    const now = new Date().toISOString()
    const preset: FormulaPreset = {
      id: createId(),
      name: trimmed,
      formula: cloneFormula(calculator.state.formula),
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
    const duplicate: FormulaPreset = {
      id: createId(),
      name: `${source.name} copia`,
      formula: cloneFormula(source.formula),
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
