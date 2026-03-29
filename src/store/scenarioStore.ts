import { create } from 'zustand';
import type { Scenario } from '../types';
import { createDefaultScenario } from '../types';

interface ScenarioStore {
  scenarios: Scenario[];
  activeScenarioId: string;
  addScenario: () => void;
  removeScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  setActiveScenario: (id: string) => void;
  loadScenarios: (scenarios: Scenario[]) => void;
}

let counter = 0;
function nextId(): string {
  return `scenario-${++counter}-${Date.now()}`;
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  scenarios: [],
  activeScenarioId: '',

  addScenario: () =>
    set((state) => {
      const id = nextId();
      const name = `Szenario ${state.scenarios.length + 1}`;
      const scenario = createDefaultScenario(id, name);
      return {
        scenarios: [...state.scenarios, scenario],
        activeScenarioId: id,
      };
    }),

  removeScenario: (id) =>
    set((state) => {
      if (state.scenarios.length <= 1) return state;
      const filtered = state.scenarios.filter((s) => s.id !== id);
      const activeId = state.activeScenarioId === id
        ? filtered[0].id
        : state.activeScenarioId;
      return { scenarios: filtered, activeScenarioId: activeId };
    }),

  renameScenario: (id, name) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) => (s.id === id ? { ...s, name } : s)),
    })),

  updateScenario: (id, updates) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  setActiveScenario: (id) => set({ activeScenarioId: id }),

  loadScenarios: (scenarios) =>
    set({
      scenarios,
      activeScenarioId: scenarios.length > 0 ? scenarios[0].id : '',
    }),
}));
