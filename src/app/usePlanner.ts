import { useMemo, useState } from 'react'
import { calculateBackwardSchedule, validatePlanner } from '../domain/planner/schedule'
import type { PlannerState } from '../domain/planner/types'
import { parseDecimalInput } from '../domain/dough/numbers'
import { createId } from './id'

function parseLocalDateTime(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim())
  if (!match) return new Date(Number.NaN)

  const [, yearText, monthText, dayText, hourText, minuteText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const date = new Date(year, month - 1, day, hour, minute)

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
    || date.getHours() !== hour
    || date.getMinutes() !== minute
  ) {
    return new Date(Number.NaN)
  }

  return date
}

function formatHours(minutes: number): string {
  return String(Number((minutes / 60).toPrecision(12)))
}

function clonePlanner(state: PlannerState): PlannerState {
  return {
    targetDateTimeInput: state.targetDateTimeInput,
    stages: state.stages.map((stage) => ({ ...stage })),
  }
}

export function usePlanner(initialState: PlannerState) {
  const [state, setState] = useState<PlannerState>(() => clonePlanner(initialState))
  const [durationInputs, setDurationInputs] = useState<Record<string, string>>(() => Object.fromEntries(
    initialState.stages.map((stage) => [stage.id, formatHours(stage.durationMinutes)]),
  ))

  const calculated = useMemo(() => {
    const target = parseLocalDateTime(state.targetDateTimeInput)
    const errors: string[] = []

    for (const stage of state.stages) {
      if (parseDecimalInput(durationInputs[stage.id] ?? '') === null) {
        errors.push(`Ingresá una duración válida para ${stage.name.trim() || 'la etapa'}.`)
      }
    }

    errors.push(...validatePlanner(target, state.stages))

    return {
      errors,
      plannedStages: errors.length === 0
        ? calculateBackwardSchedule(target, state.stages)
        : [],
    }
  }, [durationInputs, state])

  function setTargetDateTimeInput(value: string) {
    setState((current) => ({ ...current, targetDateTimeInput: value }))
  }

  function addStage() {
    const id = createId()
    setState((current) => ({
      ...current,
      stages: [...current.stages, { id, name: 'Etapa', durationMinutes: 60 }],
    }))
    setDurationInputs((current) => ({ ...current, [id]: '1' }))
  }

  function removeStage(id: string) {
    setState((current) => ({
      ...current,
      stages: current.stages.filter((stage) => stage.id !== id),
    }))
    setDurationInputs((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  function setStageName(id: string, name: string) {
    setState((current) => ({
      ...current,
      stages: current.stages.map((stage) => (
        stage.id === id ? { ...stage, name } : stage
      )),
    }))
  }

  function setStageDurationHoursInput(id: string, value: string) {
    setDurationInputs((current) => ({ ...current, [id]: value }))
    const parsed = parseDecimalInput(value)
    if (parsed === null) return

    setState((current) => ({
      ...current,
      stages: current.stages.map((stage) => (
        stage.id === id ? { ...stage, durationMinutes: parsed * 60 } : stage
      )),
    }))
  }

  return {
    state,
    durationInputs,
    errors: calculated.errors,
    plannedStages: calculated.plannedStages,
    setTargetDateTimeInput,
    addStage,
    removeStage,
    setStageName,
    setStageDurationHoursInput,
  }
}
