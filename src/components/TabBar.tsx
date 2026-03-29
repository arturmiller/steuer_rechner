import { useState } from 'react';
import { useScenarioStore } from '../store/scenarioStore';

export function TabBar() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const activeId = useScenarioStore((s) => s.activeScenarioId);
  const setActive = useScenarioStore((s) => s.setActiveScenario);
  const addScenario = useScenarioStore((s) => s.addScenario);
  const removeScenario = useScenarioStore((s) => s.removeScenario);
  const renameScenario = useScenarioStore((s) => s.renameScenario);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const finishEditing = () => {
    if (editingId && editValue.trim()) {
      renameScenario(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center bg-white px-3 border-b border-gray-200 overflow-x-auto">
      {scenarios.map((s) => (
        <div
          key={s.id}
          className={`flex items-center gap-1 px-4 py-2 text-sm cursor-pointer border-b-2 whitespace-nowrap ${
            s.id === activeId
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActive(s.id)}
          onDoubleClick={() => startEditing(s.id, s.name)}
        >
          {editingId === s.id ? (
            <input
              className="w-28 text-sm border border-blue-400 rounded px-1 py-0.5"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span>{s.name}</span>
          )}
          {scenarios.length > 1 && (
            <button
              className="ml-1 text-gray-400 hover:text-red-500 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                removeScenario(s.id);
              }}
            >
              x
            </button>
          )}
        </div>
      ))}
      <button
        className="px-3 py-2 text-blue-600 font-bold hover:bg-gray-50"
        onClick={addScenario}
      >
        +
      </button>
    </div>
  );
}
