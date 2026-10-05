import type { CalculationMode } from '../storage/types'

interface ModeSelectorProps {
  mode: CalculationMode
  onChange: (mode: CalculationMode) => void
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector" aria-label="Modo de cálculo">
      <button
        type="button"
        className="mode-button"
        aria-pressed={mode === 'totalMass'}
        onClick={() => onChange('totalMass')}
      >
        Masa total
      </button>
      <button
        type="button"
        className="mode-button"
        aria-pressed={mode === 'flour'}
        onClick={() => onChange('flour')}
      >
        Harina
      </button>
    </div>
  )
}
