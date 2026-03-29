import { describe, it, expect, beforeEach } from 'vitest';
import { useScenarioStore } from '../scenarioStore';

describe('scenarioStore', () => {
  beforeEach(() => {
    useScenarioStore.setState({
      scenarios: [],
      activeScenarioId: '',
    });
    useScenarioStore.getState().addScenario();
  });

  it('starts with one default scenario', () => {
    const state = useScenarioStore.getState();
    expect(state.scenarios).toHaveLength(1);
    expect(state.activeScenarioId).toBe(state.scenarios[0].id);
  });

  it('adds a new scenario', () => {
    useScenarioStore.getState().addScenario();
    const state = useScenarioStore.getState();
    expect(state.scenarios).toHaveLength(2);
    expect(state.activeScenarioId).toBe(state.scenarios[1].id);
  });

  it('removes a scenario', () => {
    useScenarioStore.getState().addScenario();
    const state = useScenarioStore.getState();
    const idToRemove = state.scenarios[0].id;
    useScenarioStore.getState().removeScenario(idToRemove);
    const updated = useScenarioStore.getState();
    expect(updated.scenarios).toHaveLength(1);
    expect(updated.scenarios[0].id).not.toBe(idToRemove);
  });

  it('does not remove the last scenario', () => {
    const state = useScenarioStore.getState();
    useScenarioStore.getState().removeScenario(state.scenarios[0].id);
    expect(useScenarioStore.getState().scenarios).toHaveLength(1);
  });

  it('renames a scenario', () => {
    const state = useScenarioStore.getState();
    const id = state.scenarios[0].id;
    useScenarioStore.getState().renameScenario(id, 'Teilzeit');
    expect(useScenarioStore.getState().scenarios[0].name).toBe('Teilzeit');
  });

  it('updates a scenario', () => {
    const state = useScenarioStore.getState();
    const id = state.scenarios[0].id;
    useScenarioStore.getState().updateScenario(id, { kinder: 3 });
    expect(useScenarioStore.getState().scenarios[0].kinder).toBe(3);
  });

  it('sets active scenario', () => {
    useScenarioStore.getState().addScenario();
    const state = useScenarioStore.getState();
    const firstId = state.scenarios[0].id;
    useScenarioStore.getState().setActiveScenario(firstId);
    expect(useScenarioStore.getState().activeScenarioId).toBe(firstId);
  });

  it('loads scenarios from import', () => {
    const imported = [
      { id: 'x', name: 'Imported', person1: { bruttoJahr: 50000, fahrtstreckeKm: 10 }, hasPartner: false, person2: { bruttoJahr: 0, fahrtstreckeKm: 0 }, kinder: 1, vermietungEinkuenfte: 0, kirchensteuer: false },
    ];
    useScenarioStore.getState().loadScenarios(imported);
    const state = useScenarioStore.getState();
    expect(state.scenarios).toHaveLength(1);
    expect(state.scenarios[0].name).toBe('Imported');
    expect(state.activeScenarioId).toBe('x');
  });
});
