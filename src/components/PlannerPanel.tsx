import type { ReturnType } from 'typescript'
import type { PersistentCalculatorController } from '../app/usePersistentCalculator'

interface PlannerPanelProps {
  planner: PersistentCalculatorController['planner']
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function PlannerPanel({ planner }: PlannerPanelProps) {
  return (
    <section className="planner-card" aria-labelledby="planner-heading">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">Planificación</p>
          <h2 id="planner-heading">Fermentación y preparación</h2>
        </div>
        <button type="button" className="secondary-button" aria-label="Agregar etapa" onClick={planner.addStage}>
          + Agregar etapa
        </button>
      </div>

      <label className="planner-target-field">
        <span>Quiero terminar / hornear</span>
        <input
          type="datetime-local"
          aria-label="Fecha y hora objetivo"
          className="text-input"
          value={planner.state.targetDateTimeInput}
          onChange={(event) => planner.setTargetDateTimeInput(event.target.value)}
        />
      </label>

      <div className="planner-stage-list">
        {planner.state.stages.map((stage) => (
          <div className="planner-stage-row" data-testid="planner-stage" key={stage.id}>
            <label>
              <span>Etapa</span>
              <input
                aria-label="Nombre de la etapa"
                className="text-input"
                value={stage.name}
                onChange={(event) => planner.setStageName(stage.id, event.target.value)}
              />
            </label>
            <label>
              <span>Duración (h)</span>
              <input
                aria-label="Duración (h)"
                className="number-input"
                inputMode="decimal"
                value={planner.durationInputs[stage.id] ?? ''}
                onChange={(event) => planner.setStageDurationHoursInput(stage.id, event.target.value)}
              />
            </label>
            <button
              type="button"
              className="icon-button"
              aria-label={`Eliminar ${stage.name.trim() || 'Etapa'}`}
              onClick={() => planner.removeStage(stage.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {planner.errors.length > 0 ? (
        <div className="planner-status" role="status" aria-label="Estado del planificador">
          {planner.errors.map((error) => <p key={error}>{error}</p>)}
        </div>
      ) : null}

      {planner.plannedStages.length > 0 ? (
        <div className="planner-schedule" role="region" aria-label="Cronograma calculado">
          {planner.plannedStages.map((stage) => (
            <div className="planner-schedule-row" key={stage.id}>
              <strong>{stage.name}</strong>
              <span>{formatDateTime(stage.start)} → {formatDateTime(stage.end)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
