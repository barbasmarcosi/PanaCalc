import type { PlannedStage, PlannerStage } from './types'

export function calculateBackwardSchedule(target: Date, stages: PlannerStage[]): PlannedStage[] {
  const planned = new Array<PlannedStage>(stages.length)
  let cursor = target.getTime()

  for (let index = stages.length - 1; index >= 0; index -= 1) {
    const stage = stages[index]
    const end = new Date(cursor)
    const start = new Date(cursor - stage.durationMinutes * 60_000)
    planned[index] = { ...stage, start, end }
    cursor = start.getTime()
  }

  return planned
}

export function validatePlanner(target: Date, stages: PlannerStage[]): string[] {
  const errors: string[] = []

  if (!Number.isFinite(target.getTime())) {
    errors.push('Elegí una fecha y hora objetivo válidas.')
  }

  if (stages.some((stage) => !stage.name.trim())) {
    errors.push('Todas las etapas necesitan un nombre.')
  }

  if (stages.some((stage) => !Number.isFinite(stage.durationMinutes) || stage.durationMinutes < 0)) {
    errors.push('La duración de cada etapa debe ser un número no negativo.')
  }

  return errors
}
