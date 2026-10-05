import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CalculatorPanel } from './CalculatorPanel'

describe('PrefermentEditor', () => {
  it('shows poolish contribution and remaining final-mix flour and water', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)

    await user.click(screen.getByRole('button', { name: 'Harina' }))
    const flour = screen.getByLabelText('Harina disponible')
    await user.clear(flour)
    await user.type(flour, '1000')

    await user.click(screen.getByRole('button', { name: 'Agregar prefermento' }))
    const row = screen.getByTestId('preferment-row')
    const name = within(row).getByLabelText('Nombre del prefermento')
    await user.clear(name)
    await user.type(name, 'Poolish')

    const flourPercent = within(row).getByLabelText('Harina prefermentada (%)')
    await user.clear(flourPercent)
    await user.type(flourPercent, '20')

    const hydration = within(row).getByLabelText('Hidratación del prefermento (%)')
    await user.clear(hydration)
    await user.type(hydration, '100')

    const results = screen.getByRole('region', { name: 'Resultado' })
    expect(results).toHaveTextContent('Poolish')
    expect(results).toHaveTextContent('Harina en prefermento')
    expect(results).toHaveTextContent('200 g')
    expect(results).toHaveTextContent('Agua en prefermento')
    expect(results).toHaveTextContent('Harina mezcla final')
    expect(results).toHaveTextContent('800 g')
    expect(results).toHaveTextContent('Agua mezcla final')
    expect(results).toHaveTextContent('500 g')
    expect(results).toHaveTextContent('1.700 g')
  })

  it('rejects multiple preferments that exceed formula flour or water', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    await user.click(screen.getByRole('button', { name: 'Agregar prefermento' }))
    await user.click(screen.getByRole('button', { name: 'Agregar prefermento' }))

    const rows = screen.getAllByTestId('preferment-row')
    const firstFlour = within(rows[0]).getByLabelText('Harina prefermentada (%)')
    const secondFlour = within(rows[1]).getByLabelText('Harina prefermentada (%)')
    await user.clear(firstFlour)
    await user.type(firstFlour, '60')
    await user.clear(secondFlour)
    await user.type(secondFlour, '50')

    expect(screen.getByRole('alert')).toHaveTextContent('Los prefermentos no pueden usar más del 100% de la harina total.')
    expect(screen.queryByRole('region', { name: 'Resultado' })).not.toBeInTheDocument()
  })

  it('removes a preferment explicitly', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    await user.click(screen.getByRole('button', { name: 'Agregar prefermento' }))
    const row = screen.getByTestId('preferment-row')
    await user.click(within(row).getByRole('button', { name: 'Eliminar Prefermento' }))
    expect(screen.queryByTestId('preferment-row')).not.toBeInTheDocument()
  })
})
