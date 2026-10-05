import { CalculatorPanel } from '../components/CalculatorPanel'

export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Calculadora de masas</p>
        <h1>PanaCalc</h1>
        <p className="subtitle">Harina, hidratación y masa total sin vueltas.</p>
      </header>
      <CalculatorPanel />
    </main>
  )
}
