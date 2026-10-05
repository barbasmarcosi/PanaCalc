import type { MassUnit } from '../domain/mass/units'

interface MassUnitSelectProps {
  value: MassUnit
  onChange: (unit: MassUnit) => void
  label: string
  className?: string
}

export function MassUnitSelect({
  value,
  onChange,
  label,
  className = '',
}: MassUnitSelectProps) {
  return (
    <select
      aria-label={label}
      className={`unit-select mass-unit-select ${className}`.trim()}
      value={value}
      onChange={(event) => onChange(event.target.value as MassUnit)}
    >
      <option value="g">g</option>
      <option value="kg">kg</option>
      <option value="oz">oz</option>
      <option value="lb">lb</option>
    </select>
  )
}
