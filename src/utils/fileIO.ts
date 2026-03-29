import type { Scenario } from '../types';

export function scenariosToJson(scenarios: Scenario[]): string {
  return JSON.stringify(scenarios, null, 2);
}

export function jsonToScenarios(json: string): Scenario[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error('Ungültiges Format: Array erwartet');
  }
  for (const item of parsed) {
    if (typeof item.id !== 'string' || typeof item.name !== 'string' || !item.person1) {
      throw new Error('Ungültiges Szenario-Format');
    }
  }
  return parsed as Scenario[];
}

export function downloadJson(scenarios: Scenario[], filename = 'steuerrechner.json'): void {
  const json = scenariosToJson(scenarios);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function uploadJson(): Promise<Scenario[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('Keine Datei ausgewählt'));
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const scenarios = jsonToScenarios(reader.result as string);
          resolve(scenarios);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
