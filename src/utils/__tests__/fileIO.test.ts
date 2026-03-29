import { describe, it, expect } from 'vitest';
import { scenariosToJson, jsonToScenarios } from '../fileIO';
import { createDefaultScenario } from '../../types';

describe('fileIO', () => {
  it('serializes scenarios to JSON string', () => {
    const scenarios = [createDefaultScenario('1', 'Test')];
    const json = scenariosToJson(scenarios);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Test');
  });

  it('deserializes JSON string to scenarios', () => {
    const scenarios = [createDefaultScenario('1', 'Test')];
    const json = scenariosToJson(scenarios);
    const result = jsonToScenarios(json);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test');
    expect(result[0].person1.bruttoJahr).toBe(0);
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToScenarios('not json')).toThrow();
  });

  it('throws on invalid structure', () => {
    expect(() => jsonToScenarios('[{"invalid": true}]')).toThrow();
  });
});
