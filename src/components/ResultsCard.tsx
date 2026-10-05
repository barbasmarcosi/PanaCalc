import type { CalculatorViewState } from '../app/useCalculator'
import { formatMass, type MassUnit } from '../domain/mass/units'
import { MassUnitSelect } from './MassUnitSelect'

interface ResultsCardProps {
  state: CalculatorViewState
  onResultUnitChange?: (unit: MassUnit) => void
}

export function ResultsCard({ state, onResultUnitChange }: ResultsCardProps) {
  if (state.errors.length > 0 || !state.result) {
    return (
      <div className="validation-card" role="alert">
        <strong>Revisá estos datos</strong>
        <ul>
          {state.errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      </div>
    )
  }

  const mass = (grams: number) => formatMass(grams, state.resultUnit, 'es-AR')

  return (
    <section className="results-card" aria-label="Resultado">
      <div className="result-heading">
        <div>
          <p className="section-kicker">Resultado</p>
          <h2>Tu masa</h2>
        </div>
        <div className="result-tools">
          {onResultUnitChange ? (
            <MassUnitSelect
              value={state.resultUnit}
              onChange={onResultUnitChange}
              label="Unidad de resultados"
            />
          ) : null}
          <span className="total-chip">{mass(state.result.totalMassGrams)}</span>
        </div>
      </div>

      <dl className="result-list">
        <div className="result-row emphasized-result">
          <dt>Harina</dt>
          <dd>{mass(state.result.flourGrams)}</dd>
        </div>
        {state.result.ingredients.map((ingredient) => (
          <div className="result-row" key={ingredient.id}>
            <dt>{ingredient.name || 'Ingrediente'}</dt>
            <dd>{mass(ingredient.grams)}</dd>
          </div>
        ))}
        <div className="result-row total-result">
          <dt>Masa total</dt>
          <dd>{mass(state.result.totalMassGrams)}</dd>
        </div>
      </dl>

      {state.result.prefermentBreakdown.preferments.length > 0 ? (
        <div className="preferment-results" aria-label="Desglose de prefermentos">
          <h3>Prefermentos</h3>
          {state.result.prefermentBreakdown.preferments.map((preferment) => (
            <div className="preferment-result-card" key={preferment.id}>
              <strong>{preferment.name}</strong>
              <dl>
                <div className="result-row">
                  <dt>Harina en prefermento</dt>
                  <dd>{mass(preferment.flourGrams)}</dd>
                </div>
                <div className="result-row">
                  <dt>Agua en prefermento</dt>
                  <dd>{mass(preferment.waterGrams)}</dd>
                </div>
              </dl>
            </div>
          ))}
          <dl className="final-mix-results">
            <div className="result-row">
              <dt>Harina mezcla final</dt>
              <dd>{mass(state.result.prefermentBreakdown.finalMixFlourGrams)}</dd>
            </div>
            <div className="result-row">
              <dt>Agua mezcla final</dt>
              <dd>{mass(state.result.prefermentBreakdown.finalMixWaterGrams)}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  )
}
