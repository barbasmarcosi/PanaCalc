import type { IngredientUnit } from '../domain/dough/types'
import type { MassUnit } from '../domain/mass/units'
import type { ReturnTypeOfUseCalculator } from './calculatorTypes'

interface IngredientEditorProps {
  calculator: ReturnTypeOfUseCalculator
}

type IngredientDisplayUnit = 'percent' | MassUnit

export function IngredientEditor({ calculator }: IngredientEditorProps) {
  const { state } = calculator

  return (
    <section className="calculator-section" aria-labelledby="ingredients-heading">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">Fórmula</p>
          <h2 id="ingredients-heading">Ingredientes</h2>
        </div>
        <button type="button" className="secondary-button add-button" aria-label="Agregar ingrediente" onClick={calculator.addIngredient}>
          + Agregar ingrediente
        </button>
      </div>

      <div className="ingredient-list">
        <div className="ingredient-row flour-row">
          <span className="ingredient-name">Harina</span>
          <span className="flour-percent">100%</span>
        </div>

        {state.formula.ingredients.map((ingredient) => {
          const currentName = ingredient.name || 'Ingrediente'
          const isCustom = ingredient.kind === 'custom'
          const selectedUnit: IngredientDisplayUnit = ingredient.unit === 'percent'
            ? 'percent'
            : ingredient.massUnit ?? 'g'

          return (
            <div
              className="ingredient-row editable-ingredient-row"
              key={ingredient.id}
              data-testid={isCustom ? 'ingredient-custom' : undefined}
            >
              <div className="ingredient-primary-field">
                {isCustom ? (
                  <label className="field-label compact-field-label">
                    <span className="sr-only">Nombre del ingrediente</span>
                    <input
                      aria-label="Nombre del ingrediente"
                      className="text-input ingredient-name-input"
                      value={ingredient.name}
                      onChange={(event) => calculator.setIngredientName(ingredient.id, event.target.value)}
                    />
                  </label>
                ) : (
                  <span className="ingredient-name">{ingredient.name}</span>
                )}
              </div>

              <label className="quantity-field">
                <span className="sr-only">Cantidad de {currentName}</span>
                <input
                  aria-label={`Cantidad de ${currentName}`}
                  className="number-input"
                  inputMode="decimal"
                  value={state.quantityInputs[ingredient.id] ?? ''}
                  onChange={(event) => calculator.setIngredientQuantityInput(ingredient.id, event.target.value)}
                />
              </label>

              <div className="unit-field">
                {isCustom ? (
                  <label>
                    <span className="sr-only">Unidad de {currentName}</span>
                    <select
                      aria-label={`Unidad de ${currentName}`}
                      className="unit-select"
                      value={selectedUnit}
                      onChange={(event) => {
                        const unit = event.target.value as IngredientDisplayUnit
                        if (unit === 'percent') {
                          calculator.setIngredientUnit(ingredient.id, 'percent' as IngredientUnit)
                        } else {
                          calculator.setIngredientMassUnit(ingredient.id, unit)
                        }
                      }}
                    >
                      <option value="percent">%</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="oz">oz</option>
                      <option value="lb">lb</option>
                    </select>
                  </label>
                ) : (
                  <span className="unit-select unit-display" aria-label={`Unidad de ${currentName}`}>%</span>
                )}
              </div>

              {isCustom ? (
                <button
                  type="button"
                  className="icon-button remove-button"
                  aria-label={`Eliminar ${currentName}`}
                  title={`Eliminar ${currentName}`}
                  onClick={() => calculator.removeIngredient(ingredient.id)}
                >
                  ×
                </button>
              ) : (
                <span className="row-spacer" aria-hidden="true" />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
