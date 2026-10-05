import type { ProductionMode } from '../domain/production/types'

interface ModeSelectorProps {
  mode: ProductionMode
  onChange: (mode: ProductionMode) => void
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  const options: Array<{ mode: ProductionMode; label: string }> = [
    { mode: 'totalMass', label: 'Masa total' },
    { mode: 'flour', label: 'Harina' },
    { mode: 'pieces', label: 'Piezas' },
  ]

  return (
    <div className="mode-selector" aria-label="Modo de cálculo">
      {options.map((option) => (
        <button
          type="button"
          className="mode-button"
          aria-pressed={mode === option.mode}
          key={option.mode}
          onClick={() => onChange(option.mode)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
