import type { ReturnTypeOfUseCalculator } from './calculatorTypes'

interface PrefermentEditorProps {
  calculator: ReturnTypeOfUseCalculator
}

export function PrefermentEditor({ calculator }: PrefermentEditorProps) {
  const { state } = calculator
  const preferments = state.formula.preferments ?? []

  return (
    <section className="calculator-section preferment-section" aria-labelledby="preferments-heading">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">Avanzado</p>
          <h2 id="preferments-heading">Prefermentos</h2>
        </div>
        <button
          type="button"
          className="secondary-button add-button"
          aria-label="Agregar prefermento"
          onClick={calculator.addPreferment}
        >
          + Agregar prefermento
        </button>
      </div>

      {preferments.length === 0 ? (
        <p className="section-help">
          Podés modelar poolish, biga o levain como porcentaje de harina total e hidratación propia.
        </p>
      ) : (
        <div className="preferment-list">
          {preferments.map((preferment) => {
            const displayName = preferment.name.trim() || 'Prefermento'
            return (
              <div className="preferment-row" data-testid="preferment-row" key={preferment.id}>
                <label className="preferment-name-field">
                  <span>Nombre</span>
                  <input
                    aria-label="Nombre del prefermento"
                    className="text-input"
                    value={preferment.name}
                    onChange={(event) => calculator.setPrefermentName(preferment.id, event.target.value)}
                  />
                </label>

                <label>
                  <span>Harina (%)</span>
                  <input
                    aria-label="Harina prefermentada (%)"
                    className="number-input"
                    inputMode="decimal"
                    value={state.prefermentFlourInputs[preferment.id] ?? ''}
                    onChange={(event) => calculator.setPrefermentFlourPercentInput(preferment.id, event.target.value)}
                  />
                </label>

                <label>
                  <span>Hidratación (%)</span>
                  <input
                    aria-label="Hidratación del prefermento (%)"
                    className="number-input"
                    inputMode="decimal"
                    value={state.prefermentHydrationInputs[preferment.id] ?? ''}
                    onChange={(event) => calculator.setPrefermentHydrationPercentInput(preferment.id, event.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="icon-button remove-button"
                  aria-label={`Eliminar ${displayName}`}
                  onClick={() => calculator.removePreferment(preferment.id)}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
