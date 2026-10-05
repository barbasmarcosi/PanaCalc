import { useState } from 'react'
import type { PersistentCalculatorController } from '../app/usePersistentCalculator'
import type { FormulaPreset } from '../storage/types'
import { PresetDialog } from './PresetDialog'

interface PresetListProps {
  persistent: PersistentCalculatorController
}

type DialogState =
  | { mode: 'save' }
  | { mode: 'rename'; preset: FormulaPreset }
  | null

function formulaSummary(preset: FormulaPreset) {
  return preset.formula.ingredients
    .map((ingredient) => `${ingredient.name} ${ingredient.quantity}${ingredient.unit === 'percent' ? '%' : ' g'}`)
    .join(' · ')
}

export function PresetList({ persistent }: PresetListProps) {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const pendingDelete = persistent.presets.find((preset) => preset.id === pendingDeleteId)

  return (
    <section className="presets-card" aria-labelledby="presets-heading">
      <div className="section-heading-row presets-heading-row">
        <div>
          <p className="section-kicker">Tus recetas</p>
          <h2 id="presets-heading">Mis fórmulas</h2>
        </div>
        <button type="button" className="primary-button" onClick={() => setDialog({ mode: 'save' })}>
          Guardar fórmula
        </button>
      </div>

      {persistent.persistenceWarning ? (
        <p className="persistence-warning" role="status">{persistent.persistenceWarning}</p>
      ) : null}

      {persistent.presets.length === 0 ? (
        <p className="empty-presets">Guardá una fórmula para reutilizarla con cualquier cantidad de masa o harina.</p>
      ) : (
        <div className="preset-list">
          {persistent.presets.map((preset) => (
            <article className="preset-item" key={preset.id}>
              <div className="preset-copy">
                <h3>{preset.name}</h3>
                <p>{formulaSummary(preset)}</p>
              </div>
              <div className="preset-actions">
                <button type="button" className="primary-button compact-button" aria-label={`Usar ${preset.name}`} onClick={() => persistent.loadPreset(preset.id)}>Usar</button>
                <button type="button" className="secondary-button compact-button" aria-label={`Actualizar ${preset.name}`} onClick={() => persistent.updatePresetFromCurrentFormula(preset.id)}>Actualizar</button>
                <button type="button" className="secondary-button compact-button" aria-label={`Renombrar ${preset.name}`} onClick={() => setDialog({ mode: 'rename', preset })}>Renombrar</button>
                <button type="button" className="secondary-button compact-button" aria-label={`Duplicar ${preset.name}`} onClick={() => persistent.duplicatePreset(preset.id)}>Duplicar</button>
                <button type="button" className="danger-button compact-button" aria-label={`Eliminar ${preset.name}`} onClick={() => setPendingDeleteId(preset.id)}>Eliminar</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {dialog?.mode === 'save' ? (
        <PresetDialog
          mode="save"
          onClose={() => setDialog(null)}
          onConfirm={persistent.savePreset}
        />
      ) : null}

      {dialog?.mode === 'rename' ? (
        <PresetDialog
          mode="rename"
          initialName={dialog.preset.name}
          onClose={() => setDialog(null)}
          onConfirm={(name) => persistent.renamePreset(dialog.preset.id, name)}
        />
      ) : null}

      {pendingDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="preset-dialog" role="alertdialog" aria-modal="true" aria-label="Eliminar fórmula">
            <h2>¿Eliminar esta fórmula?</h2>
            <p>Esta acción borra la fórmula guardada de este dispositivo.</p>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setPendingDeleteId(null)}>Cancelar</button>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  persistent.deletePreset(pendingDelete.id)
                  setPendingDeleteId(null)
                }}
              >
                Confirmar eliminación
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
