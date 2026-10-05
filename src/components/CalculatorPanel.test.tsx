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
    await user.selectOptions(within(row).getByLabelText('Unidad de Aceite'), 'g')
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
    await user.selectOptions(within(row).getByLabelText('Unidad de Ingrediente'), 'g')
    expect(screen.getByRole('alert')).toHaveTextContent('Los ingredientes fijos deben sumar menos que la masa total.')
    expect(screen.queryByRole('region', { name: 'Resultado' })).not.toBeInTheDocument()
  })
})


describe('CalculatorPanel V2 production UI', () => {
  it('offers total mass, flour, and pieces production modes', () => {
    render(<CalculatorPanel />)
    expect(screen.getByRole('button', { name: 'Masa total' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Harina' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Piezas' })).toBeInTheDocument()
  })

  it('calculates six 280 gram pieces as 1680 grams', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    await user.click(screen.getByRole('button', { name: 'Piezas' }))

    const count = screen.getByLabelText('Cantidad de piezas')
    const mass = screen.getByLabelText('Peso por pieza')
    await user.clear(count)
    await user.type(count, '6')
    await user.clear(mass)
    await user.type(mass, '280')

    expect(screen.getByRole('region', { name: 'Resultado' })).toHaveTextContent('1.680 g')
    expect(screen.queryByLabelText('Multiplicador personalizado')).not.toBeInTheDocument()
  })

  it('rejects fractional piece counts in the UI', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    await user.click(screen.getByRole('button', { name: 'Piezas' }))
    const count = screen.getByLabelText('Cantidad de piezas')
    await user.clear(count)
    await user.type(count, '2,5')

    expect(screen.getByRole('alert')).toHaveTextContent('La cantidad de piezas debe ser un entero mayor que 0.')
    expect(screen.queryByRole('region', { name: 'Resultado' })).not.toBeInTheDocument()
  })

  it('changes target units without changing physical dough mass', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    const target = screen.getByLabelText('Masa total objetivo')
    await user.clear(target)
    await user.type(target, '453.59237')

    await user.selectOptions(screen.getByLabelText('Unidad de masa objetivo'), 'lb')

    expect(target).toHaveValue('1')
    expect(screen.getByRole('region', { name: 'Resultado' })).toHaveTextContent('453,6 g')
  })

  it('changes result display units without changing the calculation', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)

    await user.selectOptions(screen.getByLabelText('Unidad de resultados'), 'kg')

    const results = screen.getByRole('region', { name: 'Resultado' })
    expect(results).toHaveTextContent('1 kg')
    expect(results).toHaveTextContent('0,588 kg')
  })

  it('offers percent and all mass units for custom ingredients while water stays percent-only', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    await user.click(screen.getByRole('button', { name: 'Agregar ingrediente' }))
    const row = screen.getByTestId('ingredient-custom')
    const unit = within(row).getByLabelText('Unidad de Ingrediente')

    expect(within(unit).getByRole('option', { name: '%' })).toBeInTheDocument()
    expect(within(unit).getByRole('option', { name: 'g' })).toBeInTheDocument()
    expect(within(unit).getByRole('option', { name: 'kg' })).toBeInTheDocument()
    expect(within(unit).getByRole('option', { name: 'oz' })).toBeInTheDocument()
    expect(within(unit).getByRole('option', { name: 'lb' })).toBeInTheDocument()
    expect(screen.getByLabelText('Unidad de Agua')).toHaveTextContent('%')
  })

  it('reinterprets a custom numeric value in the selected mass unit', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    await user.click(screen.getByRole('button', { name: 'Harina' }))
    await user.clear(screen.getByLabelText('Harina disponible'))
    await user.type(screen.getByLabelText('Harina disponible'), '1000')
    await user.click(screen.getByRole('button', { name: 'Agregar ingrediente' }))

    const row = screen.getByTestId('ingredient-custom')
    const quantity = within(row).getByLabelText('Cantidad de Ingrediente')
    await user.clear(quantity)
    await user.type(quantity, '1')
    await user.selectOptions(within(row).getByLabelText('Unidad de Ingrediente'), 'lb')

    expect(screen.getByRole('region', { name: 'Resultado' })).toHaveTextContent('453,6 g')
  })

  it('applies quick scaling in total-mass mode while fixed grams stay fixed', async () => {
    const user = userEvent.setup()
    render(<CalculatorPanel />)
    await user.click(screen.getByRole('button', { name: 'Agregar ingrediente' }))
    const row = screen.getByTestId('ingredient-custom')
    const quantity = within(row).getByLabelText('Cantidad de Ingrediente')
    await user.clear(quantity)
    await user.type(quantity, '15')
    await user.selectOptions(within(row).getByLabelText('Unidad de Ingrediente'), 'g')

    await user.click(screen.getByRole('button', { name: 'Escalar ×2' }))

    const results = screen.getByRole('region', { name: 'Resultado' })
    expect(results).toHaveTextContent('2.000 g')
    expect(results).toHaveTextContent('15 g')
  })
})
