import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../app/App'

describe('PlannerPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  it('calculates a local start time from a bake target and stage duration', async () => {
    const user = userEvent.setup()
    render(<App />)

    const target = screen.getByLabelText('Fecha y hora objetivo')
    await user.type(target, '2026-10-06T20:30')
    await user.click(screen.getByRole('button', { name: 'Agregar etapa' }))

    const row = screen.getByTestId('planner-stage')
    const name = within(row).getByLabelText('Nombre de la etapa')
    await user.clear(name)
    await user.type(name, 'Bloque')

    const duration = within(row).getByLabelText('Duración (h)')
    await user.clear(duration)
    await user.type(duration, '2')

    const schedule = screen.getByRole('region', { name: 'Cronograma calculado' })
    expect(schedule).toHaveTextContent('Bloque')
    expect(schedule).toHaveTextContent('18:30')
    expect(schedule).toHaveTextContent('20:30')
  })

  it('shows planner validation instead of a stale schedule', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Agregar etapa' }))
    expect(screen.getByRole('status', { name: 'Estado del planificador' })).toHaveTextContent('Elegí una fecha y hora objetivo válidas.')

    const duration = screen.getByLabelText('Duración (h)')
    await user.clear(duration)
    await user.type(duration, '-1')
    expect(screen.getByRole('status', { name: 'Estado del planificador' })).toHaveTextContent('La duración de cada etapa debe ser un número no negativo.')
    expect(screen.queryByRole('region', { name: 'Cronograma calculado' })).not.toBeInTheDocument()
  })
})
