import type { ReturnTypeOfUseCalculator } from './calculatorTypes'
import { MassUnitSelect } from './MassUnitSelect'
import { ScaleControls } from './ScaleControls'

interface ProductionControlsProps {
  calculator: ReturnTypeOfUseCalculator
}

export function ProductionControls({ calculator }: ProductionControlsProps) {
  const { state } = calculator

  if (state.mode === 'pieces') {
    return (
      <div className="calculator-section target-section">
        <div className="pieces-grid">
          <label className="production-field">
            <span className="target-label">Cantidad de piezas</span>
            <input
              aria-label="Cantidad de piezas"
              className="number-input production-input"
              inputMode="numeric"
              value={state.pieceCountInput}
              onChange={(event) => calculator.setPieceCountInput(event.target.value)}
            />
          </label>

          <label className="production-field">
            <span className="target-label">Peso por pieza</span>
            <div className="mass-input-row">
              <input
                aria-label="Peso por pieza"
                className="number-input production-input"
                inputMode="decimal"
                value={state.pieceMassInput}
                onChange={(event) => calculator.setPieceMassInput(event.target.value)}
              />
              <MassUnitSelect
                value={state.pieceMassUnit}
                onChange={calculator.setPieceMassUnit}
                label="Unidad de peso por pieza"
              />
            </div>
          </label>
        </div>
      </div>
    )
  }

  const targetLabel = state.mode === 'totalMass' ? 'Masa total objetivo' : 'Harina disponible'

  return (
    <div className="calculator-section target-section">
      <label className="target-label" htmlFor="production-target">{targetLabel}</label>
      <div className="target-input-wrap">
        <input
          id="production-target"
          className="target-input"
          aria-label={targetLabel}
          inputMode="decimal"
          value={state.targetInput}
          onChange={(event) => calculator.setTargetInput(event.target.value)}
        />
        <MassUnitSelect
          value={state.targetUnit}
          onChange={calculator.setTargetUnit}
          label="Unidad de masa objetivo"
          className="target-unit-select"
        />
      </div>
      <ScaleControls calculator={calculator} />
    </div>
  )
}
