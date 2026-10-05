import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { usePersistentCalculator } from '../app/usePersistentCalculator'
import { CalculatorPanel } from './CalculatorPanel'
import { PresetList } from './PresetList'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

function Harness() {
  const persistent = usePersistentCalculator(new MemoryStorage())
  return (
    <>
      <CalculatorPanel calculator={persistent.calculator} />
      <PresetList persistent={persistent} />
    </>
  )
}

describe('PresetList', () => {
  it('saves a named formula and rejects an empty name', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Guardar fórmula' }))
    expect(screen.getByRole('dialog', { name: 'Guardar fórmula' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Escribí un nombre')

    await user.type(screen.getByLabelText('Nombre de la fórmula'), 'Pizza napolitana')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('Pizza napolitana')).toBeInTheDocument()
  })

  it('loads a preset without changing the current target', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const water = screen.getByLabelText('Cantidad de Agua')
    await user.clear(water)
    await user.type(water, '80')
    await user.click(screen.getByRole('button', { name: 'Guardar fórmula' }))
    await user.type(screen.getByLabelText('Nombre de la fórmula'), 'Focaccia')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.clear(screen.getByLabelText('Masa total objetivo'))
    await user.type(screen.getByLabelText('Masa total objetivo'), '1500')
    await user.clear(screen.getByLabelText('Cantidad de Agua'))
    await user.type(screen.getByLabelText('Cantidad de Agua'), '60')

    await user.click(screen.getByRole('button', { name: 'Usar Focaccia' }))
    expect(screen.getByLabelText('Masa total objetivo')).toHaveValue('1500')
    expect(screen.getByLabelText('Cantidad de Agua')).toHaveValue('80')
  })

  it('renames and duplicates a formula', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Guardar fórmula' }))
    await user.type(screen.getByLabelText('Nombre de la fórmula'), 'Pizza')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(screen.getByRole('button', { name: 'Renombrar Pizza' }))
    const dialog = screen.getByRole('dialog', { name: 'Renombrar fórmula' })
    const name = within(dialog).getByLabelText('Nombre de la fórmula')
    await user.clear(name)
    await user.type(name, 'Napolitana')
    await user.click(within(dialog).getByRole('button', { name: 'Renombrar' }))
    expect(screen.getByText('Napolitana')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Duplicar Napolitana' }))
    expect(screen.getAllByText(/Napolitana/).length).toBeGreaterThan(1)
  })

  it('updates a saved formula from the current editor state', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Guardar fórmula' }))
    await user.type(screen.getByLabelText('Nombre de la fórmula'), 'Pizza')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const water = screen.getByLabelText('Cantidad de Agua')
    await user.clear(water)
    await user.type(water, '72')
    await user.click(screen.getByRole('button', { name: 'Actualizar Pizza' }))

    await user.clear(water)
    await user.type(water, '60')
    await user.click(screen.getByRole('button', { name: 'Usar Pizza' }))
    expect(screen.getByLabelText('Cantidad de Agua')).toHaveValue('72')
  })

  it('requires an explicit confirmation before deleting a formula', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Guardar fórmula' }))
    await user.type(screen.getByLabelText('Nombre de la fórmula'), 'Pizza')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(screen.getByRole('button', { name: 'Eliminar Pizza' }))
    expect(screen.getByRole('alertdialog', { name: 'Eliminar fórmula' })).toBeInTheDocument()
    expect(screen.getByText('Pizza')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    expect(screen.queryByText('Pizza')).not.toBeInTheDocument()
  })
})
