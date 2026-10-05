import { useCalculator } from '../app/useCalculator'
import type { ReturnTypeOfUseCalculator } from './calculatorTypes'
import { IngredientEditor } from './IngredientEditor'
import { ModeSelector } from './ModeSelector'
import { ProductionControls } from './ProductionControls'
import { ResultsCard } from './ResultsCard'
import '../styles/calculator.css'

interface CalculatorPanelProps {
  calculator?: ReturnTypeOfUseCalculator
}

function CalculatorPanelContent({ calculator }: { calculator: ReturnTypeOfUseCalculator }) {
  const { state } = calculator

  return (
    <div className="calculator-layout">
      <section className="calculator-card calculator-main" aria-label="Calculadora">
        <div className="calculator-section mode-section">
          <p className="section-kicker">¿Qué conocés?</p>
          <ModeSelector mode={state.mode} onChange={calculator.setMode} />
        </div>

        <ProductionControls calculator={calculator} />
        <IngredientEditor calculator={calculator} />
      </section>

      <aside className="results-column">
        <ResultsCard state={state} onResultUnitChange={calculator.setResultUnit} />
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
