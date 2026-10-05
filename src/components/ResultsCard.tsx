import { formatGrams } from '../domain/dough/numbers'
import type { CalculatorViewState } from '../app/useCalculator'

interface ResultsCardProps {
  state: CalculatorViewState
}

function grams(value: number) {
  return `${formatGrams(value, 'es-AR')} g`
}

export function ResultsCard({ state }: ResultsCardProps) {
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

  return (
    <section className="results-card" aria-label="Resultado">
      <div className="result-heading">
        <div>
          <p className="section-kicker">Resultado</p>
          <h2>Tu masa</h2>
        </div>
        <span className="total-chip">{grams(state.result.totalMassGrams)}</span>
      </div>

      <dl className="result-list">
        <div className="result-row emphasized-result">
          <dt>Harina</dt>
          <dd>{grams(state.result.flourGrams)}</dd>
        </div>
        {state.result.ingredients.map((ingredient) => (
          <div className="result-row" key={ingredient.id}>
            <dt>{ingredient.name || 'Ingrediente'}</dt>
            <dd>{grams(ingredient.grams)}</dd>
          </div>
        ))}
        <div className="result-row total-result">
          <dt>Masa total</dt>
          <dd>{grams(state.result.totalMassGrams)}</dd>
        </div>
      </dl>
    </section>
  )
}
