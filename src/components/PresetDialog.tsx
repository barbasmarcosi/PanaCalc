import { useEffect, useId, useState } from 'react'

type DialogMode = 'save' | 'rename'

interface PresetDialogProps {
  mode: DialogMode
  initialName?: string
  onConfirm: (name: string) => boolean
  onClose: () => void
}

export function PresetDialog({ mode, initialName = '', onConfirm, onClose }: PresetDialogProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const titleId = useId()
  const title = mode === 'save' ? 'Guardar fórmula' : 'Renombrar fórmula'
  const action = mode === 'save' ? 'Guardar' : 'Renombrar'

  useEffect(() => {
    setName(initialName)
    setError(null)
  }, [initialName, mode])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Escribí un nombre para la fórmula.')
      return
    }
    if (onConfirm(name)) onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="preset-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <label className="dialog-label">
            Nombre de la fórmula
            <input
              className="text-input dialog-input"
              aria-label="Nombre de la fórmula"
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError(null)
              }}
            />
          </label>
          {error ? <p className="dialog-error" role="alert">{error}</p> : null}
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="primary-button">{action}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
