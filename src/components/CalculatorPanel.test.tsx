import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CalculatorPanel } from './CalculatorPanel'

describe('CalculatorPanel', () => {
  it('shows the default total-mass calculator with flour and water', () => {
    render(<CalculatorPanel />)
    expect(screen.getByRole('button', { name: 'Masa total' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Masa total objetivo')).toHaveValue('1000')
    expect(screen.getByText('Harina', { selector: '.ingredient-name' })).toBeInTheDocument()
    expect(screen.getByText('100%', { selector: '.flour-percent' })).toBeInTheDocument()
    expect(screen.getByLabelText('Cantidad de Agua')).toHaveValue('70')
    expect(screen.getByRole('region', { name: 'Resultado' })).toHaveTextContent('1.000 g')
  })

  it('updates results live when hydration changes', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    const water = screen.getByLabelText('Cantidad de Agua')
    await user.clear(water)
    await user.type(water, '80')
    const results = screen.getByRole('region', { name: 'Resultado' })
    expect(results).toHaveTextContent('555,6 g')
    expect(results).toHaveTextContent('444,4 g')
  })

  it('switches to flour mode and reinterprets the target', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    await user.click(screen.getByRole('button', { name: 'Harina' }))
    expect(screen.getByLabelText('Harina disponible')).toHaveValue('1000')
    expect(screen.getByRole('region', { name: 'Resultado' })).toHaveTextContent('1.700 g')
  })

  it('adds a custom ingredient that can be renamed, switched to grams, and removed', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    await user.click(screen.getByRole('button', { name: 'Agregar ingrediente' }))
    const row = screen.getByTestId('ingredient-custom')
    const name = within(row).getByLabelText('Nombre del ingrediente')
    await user.clear(name)
    await user.type(name, 'Aceite')
    const quantity = within(row).getByLabelText('Cantidad de Aceite')
    await user.clear(quantity)
    await user.type(quantity, '15')
    await user.selectOptions(within(row).getByLabelText('Unidad de Aceite'), 'grams')
    expect(screen.getByRole('region', { name: 'Resultado' })).toHaveTextContent('15 g')
    await user.click(within(row).getByRole('button', { name: 'Eliminar Aceite' }))
    expect(screen.queryByTestId('ingredient-custom')).not.toBeInTheDocument()
  })

  it('never offers a remove action for water', () => {
    render(<CalculatorPanel />)
    expect(screen.queryByRole('button', { name: 'Eliminar Agua' })).not.toBeInTheDocument()
  })

  it('keeps water fixed as a baker percentage', () => {
    render(<CalculatorPanel />)
    expect(screen.queryByRole('combobox', { name: 'Unidad de Agua' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Unidad de Agua')).toHaveTextContent('%')
  })

  it('uses decimal mobile keyboards for numeric inputs', () => {
    render(<CalculatorPanel />)
    expect(screen.getByLabelText('Masa total objetivo')).toHaveAttribute('inputmode', 'decimal')
    expect(screen.getByLabelText('Cantidad de Agua')).toHaveAttribute('inputmode', 'decimal')
  })

  it('shows an inline error and hides calculated results for invalid fixed grams', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    await user.click(screen.getByRole('button', { name: 'Agregar ingrediente' }))
    const row = screen.getByTestId('ingredient-custom')
    const quantity = within(row).getByLabelText('Cantidad de Ingrediente')
    await user.clear(quantity)
    await user.type(quantity, '1000')
    await user.selectOptions(within(row).getByLabelText('Unidad de Ingrediente'), 'grams')
    expect(screen.getByRole('alert')).toHaveTextContent('Los ingredientes fijos deben sumar menos que la masa total.')
    expect(screen.queryByRole('region', { name: 'Resultado' })).not.toBeInTheDocument()
  })
})
