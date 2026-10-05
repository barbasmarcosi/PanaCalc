import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePlanner } from './usePlanner'

describe('usePlanner', () => {
  it('parses datetime-local as local device time and calculates backward', () => {
    const { result } = renderHook(() => usePlanner({
      targetDateTimeInput: '2026-10-06T20:30',
      stages: [
        { id: 'bulk', name: 'Bloque', durationMinutes: 120 },
      ],
    }))

    expect(result.current.plannedStages).toHaveLength(1)
    expect(result.current.plannedStages[0].start.getFullYear()).toBe(2026)
    expect(result.current.plannedStages[0].start.getMonth()).toBe(9)
    expect(result.current.plannedStages[0].start.getDate()).toBe(6)
    expect(result.current.plannedStages[0].start.getHours()).toBe(18)
    expect(result.current.plannedStages[0].start.getMinutes()).toBe(30)
    expect(result.current.plannedStages[0].end.getHours()).toBe(20)
    expect(result.current.plannedStages[0].end.getMinutes()).toBe(30)
  })

  it('converts decimal hour inputs to canonical minutes', () => {
    const { result } = renderHook(() => usePlanner({
      targetDateTimeInput: '2026-10-06T20:30',
      stages: [{ id: 'bulk', name: 'Bloque', durationMinutes: 60 }],
    }))

    act(() => result.current.setStageDurationHoursInput('bulk', '1,5'))

    expect(result.current.state.stages[0].durationMinutes).toBe(90)
    expect(result.current.durationInputs.bulk).toBe('1,5')
  })

  it('allows zero-hour stages and rejects negative duration', () => {
    const { result } = renderHook(() => usePlanner({
      targetDateTimeInput: '2026-10-06T20:30',
      stages: [{ id: 'stage', name: 'Etapa', durationMinutes: 60 }],
    }))

    act(() => result.current.setStageDurationHoursInput('stage', '0'))
    expect(result.current.errors).toEqual([])
    expect(result.current.plannedStages[0].start.getTime()).toBe(result.current.plannedStages[0].end.getTime())

    act(() => result.current.setStageDurationHoursInput('stage', '-1'))
    expect(result.current.errors).toContain('La duración de cada etapa debe ser un número no negativo.')
    expect(result.current.plannedStages).toEqual([])
  })

  it('suppresses a schedule for an invalid target datetime', () => {
    const { result } = renderHook(() => usePlanner({
      targetDateTimeInput: '',
      stages: [{ id: 'stage', name: 'Etapa', durationMinutes: 60 }],
    }))

    expect(result.current.plannedStages).toEqual([])
    expect(result.current.errors).toContain('Elegí una fecha y hora objetivo válidas.')
  })

  it('adds, renames, and removes stages', () => {
    const { result } = renderHook(() => usePlanner({ targetDateTimeInput: '', stages: [] }))

    act(() => result.current.addStage())
    const id = result.current.state.stages[0].id
    act(() => result.current.setStageName(id, 'Frío'))
    expect(result.current.state.stages[0].name).toBe('Frío')

    act(() => result.current.removeStage(id))
    expect(result.current.state.stages).toEqual([])
  })
})
