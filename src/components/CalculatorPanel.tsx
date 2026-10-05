import { useCalculator } from '../app/useCalculator'
import type { ReturnTypeOfUseCalculator } from './calculatorTypes'
import { IngredientEditor } from './IngredientEditor'
import { ModeSelector } from './ModeSelector'
import { ResultsCard } from './ResultsCard'
import '../styles/calculator.css'

interface CalculatorPanelProps {
  calculator?: ReturnTypeOfUseCalculator
}

function CalculatorPanelContent({ calculator }: { calculator: ReturnTypeOfUseCalculator }) {
  const { state } = calculator
  const isTotalMass = state.mode === 'totalMass'
  const targetLabel = isTotalMass ? 'Masa total objetivo' : 'Harina disponible'

  return (
    <div className="calculator-layout">
      <section className="calculator-card calculator-main" aria-label="Calculadora">
        <div className="calculator-section mode-section">
          <p className="section-kicker">¿Qué conocés?</p>
          <ModeSelector mode={state.mode} onChange={calculator.setMode} />
        </div>

        <div className="calculator-section target-section">
          <label className="target-label" htmlFor="target-grams">{targetLabel}</label>
          <div className="target-input-wrap">
            <input
              id="target-grams"
              className="target-input"
              aria-label={targetLabel}
              inputMode="decimal"
              value={state.targetInput}
              onChange={(event) => calculator.setTargetInput(event.target.value)}
            />
            <span className="input-suffix">g</span>
          </div>
        </div>

        <IngredientEditor calculator={calculator} />
      </section>

      <aside className="results-column">
        <ResultsCard state={state} />
      </aside>
    </div>
  )
}

function DefaultCalculatorPanel() {
  const calculator = useCalculator()
  return <CalculatorPanelContent calculator={calculator} />
}

export function CalculatorPanel({ calculator }: CalculatorPanelProps) {
  return calculator
    ? <CalculatorPanelContent calculator={calculator} />
    : <DefaultCalculatorPanel />
}
