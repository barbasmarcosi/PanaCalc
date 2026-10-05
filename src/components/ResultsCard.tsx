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
    </section>
  )
}
