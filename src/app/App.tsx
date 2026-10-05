import { CalculatorPanel } from '../components/CalculatorPanel'
import { PresetList } from '../components/PresetList'
import { usePersistentCalculator } from './usePersistentCalculator'

export function App() {
  const persistent = usePersistentCalculator()

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Calculadora de masas</p>
        <h1>PanaCalc</h1>
        <p className="subtitle">Harina, hidratación y masa total sin vueltas.</p>
      </header>
      <CalculatorPanel calculator={persistent.calculator} />
      <PresetList persistent={persistent} />
    </main>
  )
}
