import type { ProductionMode } from '../domain/production/types'

interface ModeSelectorProps {
  mode: ProductionMode
  onChange: (mode: ProductionMode) => void
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
