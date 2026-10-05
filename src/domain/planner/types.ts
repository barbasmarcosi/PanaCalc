export interface PlannerStage {
  id: string
  name: string
  durationMinutes: number
}

export interface PlannerState {
  targetDateTimeInput: string
  stages: PlannerStage[]
}

export interface PlannedStage extends PlannerStage {
  start: Date
  end: Date
}
