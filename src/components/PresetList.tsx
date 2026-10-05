import { useMemo, useState } from 'react'
import type { PersistentCalculatorController } from '../app/usePersistentCalculator'
import type { FormulaPresetV2 } from '../storage/types'
import { PresetDialog } from './PresetDialog'

interface PresetListProps {
  persistent: PersistentCalculatorController
}

type DialogState =
  | { mode: 'save' }
  | { mode: 'rename'; preset: FormulaPresetV2 }
  | null

function formulaSummary(preset: FormulaPresetV2) {
  return preset.formula.ingredients
    .map((ingredient) => {
      if (ingredient.unit === 'percent') return `${ingredient.name} ${ingredient.quantity}%`
      return `${ingredient.name} ${ingredient.quantity} g`
    })
    .join(' · ')
}

export function PresetList({ persistent }: PresetListProps) {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const pendingDelete = persistent.presets.find((preset) => preset.id === pendingDeleteId)
  const filteredPresets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    return query
      ? persistent.presets.filter((preset) => preset.name.toLocaleLowerCase('es').includes(query))
      : persistent.presets
  }, [persistent.presets, search])

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

      <label className="preset-search">
        <span className="sr-only">Buscar fórmulas</span>
        <input
          className="text-input"
          aria-label="Buscar fórmulas"
          placeholder="Buscar por nombre"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      {persistent.presets.length === 0 ? (
        <p className="empty-presets">Guardá una fórmula para reutilizarla con cualquier cantidad de masa o harina.</p>
      ) : filteredPresets.length === 0 ? (
        <p className="empty-presets">No hay fórmulas que coincidan con la búsqueda.</p>
      ) : (
        <div className="preset-list">
          {filteredPresets.map((preset) => {
            const index = persistent.presets.findIndex((item) => item.id === preset.id)
            return (
              <article className="preset-item" key={preset.id}>
                <div className="preset-copy">
                  <div className="preset-title-row">
                    <h3>{preset.name}</h3>
                    {preset.category ? <span className="preset-category">{preset.category}</span> : null}
                  </div>
                  <p>{formulaSummary(preset)}</p>
                </div>
                <div className="preset-actions">
                  <button
                    type="button"
                    className="secondary-button compact-button favorite-button"
                    aria-label={preset.favorite ? `Quitar ${preset.name} de favoritas` : `Marcar ${preset.name} como favorita`}
                    aria-pressed={preset.favorite}
                    onClick={() => persistent.togglePresetFavorite(preset.id)}
                  >
                    {preset.favorite ? '★' : '☆'}
                  </button>
                  <button type="button" className="primary-button compact-button" aria-label={`Usar ${preset.name}`} onClick={() => persistent.loadPreset(preset.id)}>Usar</button>
                  <button type="button" className="secondary-button compact-button" aria-label={`Actualizar ${preset.name}`} onClick={() => persistent.updatePresetFromCurrentFormula(preset.id)}>Actualizar</button>
                  <button type="button" className="secondary-button compact-button" aria-label={`Renombrar ${preset.name}`} onClick={() => setDialog({ mode: 'rename', preset })}>Renombrar</button>
                  <button type="button" className="secondary-button compact-button" aria-label={`Duplicar ${preset.name}`} onClick={() => persistent.duplicatePreset(preset.id)}>Duplicar</button>
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    aria-label={`Subir ${preset.name}`}
                    disabled={index <= 0}
                    onClick={() => persistent.movePreset(preset.id, 'up')}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    aria-label={`Bajar ${preset.name}`}
                    disabled={index >= persistent.presets.length - 1}
                    onClick={() => persistent.movePreset(preset.id, 'down')}
                  >
                    ↓
                  </button>
                  <button type="button" className="danger-button compact-button" aria-label={`Eliminar ${preset.name}`} onClick={() => setPendingDeleteId(preset.id)}>Eliminar</button>
                </div>
              </article>
            )
          })}
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
          initialCategory={dialog.preset.category}
          onClose={() => setDialog(null)}
          onConfirm={(name, category) => persistent.updatePresetMetadata(dialog.preset.id, name, category)}
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
