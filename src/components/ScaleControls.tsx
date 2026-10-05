import type { ReturnTypeOfUseCalculator } from './calculatorTypes'

interface ScaleControlsProps {
  calculator: ReturnTypeOfUseCalculator
}

export function ScaleControls({ calculator }: ScaleControlsProps) {
  const { state } = calculator

  return (
    <div className="scale-controls">
      <div className="scale-quick-actions" aria-label="Escala rápida">
        {[0.5, 2, 3].map((scale) => (
          <button
            type="button"
            className="secondary-button scale-button"
            aria-label={`Escalar ×${scale}`}
            key={scale}
            onClick={() => calculator.setScaleMultiplierInput(String(scale))}
          >
            ×{scale}
          </button>
        ))}
      </div>
      <label className="scale-custom-field">
        <span>Multiplicador</span>
        <input
          aria-label="Multiplicador personalizado"
          className="number-input"
          inputMode="decimal"
          value={state.scaleMultiplierInput}
          onChange={(event) => calculator.setScaleMultiplierInput(event.target.value)}
        />
      </label>
    </div>
  )
}
