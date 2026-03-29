import { useEffect } from 'react';
import { useScenarioStore } from './store/scenarioStore';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { InputPanel } from './components/InputPanel';
import { ResultPanel } from './components/ResultPanel';

function App() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const activeId = useScenarioStore((s) => s.activeScenarioId);
  const updateScenario = useScenarioStore((s) => s.updateScenario);
  const addScenario = useScenarioStore((s) => s.addScenario);

  useEffect(() => {
    if (scenarios.length === 0) {
      addScenario();
    }
  }, [scenarios.length, addScenario]);

  const activeScenario = scenarios.find((s) => s.id === activeId);

  if (!activeScenario) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <Header />
      <TabBar />
      <div className="flex flex-1 overflow-hidden">
        <InputPanel
          scenario={activeScenario}
          onChange={(updates) => updateScenario(activeId, updates)}
        />
        <ResultPanel scenario={activeScenario} />
      </div>
    </div>
  );
}

export default App;
