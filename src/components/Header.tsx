import { useScenarioStore } from '../store/scenarioStore';
import { downloadJson, uploadJson } from '../utils/fileIO';

export function Header() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const loadScenarios = useScenarioStore((s) => s.loadScenarios);

  const handleSave = () => {
    downloadJson(scenarios);
  };

  const handleLoad = async () => {
    try {
      const imported = await uploadJson();
      loadScenarios(imported);
    } catch {
      alert('Fehler beim Laden der Datei.');
    }
  };

  return (
    <header className="bg-white border-b-2 border-gray-200 px-5 py-3 flex justify-between items-center">
      <h1 className="text-lg font-bold text-blue-600">Steuerrechner 2025</h1>
      <div className="flex gap-2">
        <button
          onClick={handleLoad}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          Laden
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Speichern
        </button>
      </div>
    </header>
  );
}
