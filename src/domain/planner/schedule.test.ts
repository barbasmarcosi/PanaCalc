import { describe, expect, it } from 'vitest'
import { calculateBackwardSchedule, validatePlanner } from './schedule'
import type { PlannerStage } from './types'

const stages: PlannerStage[] = [
  { id: 'prep', name: 'Preparación', durationMinutes: 30 },
  { id: 'bulk', name: 'Bloque', durationMinutes: 120 },
  { id: 'cold', name: 'Frío', durationMinutes: 1440 },
  { id: 'temper', name: 'Atemperado', durationMinutes: 120 },
]

describe('calculateBackwardSchedule', () => {
  it('calculates stage boundaries backward while preserving chronological order', () => {
    const target = new Date(2026, 9, 6, 20, 30)
    const planned = calculateBackwardSchedule(target, stages)

    expect(planned.map((stage) => stage.id)).toEqual(['prep', 'bulk', 'cold', 'temper'])
    expect(planned.at(-1)?.end.getTime()).toBe(target.getTime())

    for (let index = 1; index < planned.length; index += 1) {
      expect(planned[index - 1].end.getTime()).toBe(planned[index].start.getTime())
    }

    const totalMinutes = stages.reduce((sum, stage) => sum + stage.durationMinutes, 0)
    expect(planned[0].start.getTime()).toBe(target.getTime() - totalMinutes * 60_000)
  })

  it('crosses midnight and calendar days correctly', () => {
    const target = new Date(2026, 9, 6, 1, 0)
    const planned = calculateBackwardSchedule(target, [
      { id: 'cold', name: 'Frío', durationMinutes: 24 * 60 },
      { id: 'temper', name: 'Atemperado', durationMinutes: 120 },
    ])

    expect(planned[0].start.getFullYear()).toBe(2026)
    expect(planned[0].start.getMonth()).toBe(9)
    expect(planned[0].start.getDate()).toBe(4)
    expect(planned[0].start.getHours()).toBe(23)
    expect(planned[1].end.getDate()).toBe(6)
    expect(planned[1].end.getHours()).toBe(1)
  })

  it('allows a zero-minute stage without breaking boundaries', () => {
    const target = new Date(2026, 9, 6, 20, 30)
    const planned = calculateBackwardSchedule(target, [
      { id: 'instant', name: 'División', durationMinutes: 0 },
    ])
    expect(planned[0].start.getTime()).toBe(target.getTime())
    expect(planned[0].end.getTime()).toBe(target.getTime())
  })
})

describe('validatePlanner', () => {
  it('rejects an invalid target date', () => {
    expect(validatePlanner(new Date(Number.NaN), stages)).toContain('Elegí una fecha y hora objetivo válidas.')
  })

  it('rejects blank stage names', () => {
    expect(validatePlanner(new Date(), [
      { id: 'x', name: '   ', durationMinutes: 30 },
    ])).toContain('Todas las etapas necesitan un nombre.')
  })

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid duration %s', (durationMinutes) => {
    expect(validatePlanner(new Date(), [
      { id: 'x', name: 'Etapa', durationMinutes },
    ])).toContain('La duración de cada etapa debe ser un número no negativo.')
  })
})
