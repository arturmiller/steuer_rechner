import { describe, it, expect } from 'vitest';
import { berechneSozialabgaben } from '../social';

describe('Sozialabgaben', () => {
  it('berechnet korrekt für 65.000 EUR Brutto, 2 Kinder', () => {
    const result = berechneSozialabgaben(65000, 2);
    expect(result.krankenversicherung).toBeCloseTo(5297.5, 0);
    expect(result.rentenversicherung).toBeCloseTo(6045, 0);
    expect(result.arbeitslosenversicherung).toBeCloseTo(845, 0);
    expect(result.pflegeversicherung).toBeCloseTo(942.5, 0);
  });

  it('berücksichtigt BBG für KV (66.150 EUR)', () => {
    const result = berechneSozialabgaben(80000, 0);
    expect(result.krankenversicherung).toBeCloseTo(5391.23, 0);
  });

  it('berücksichtigt BBG für RV (96.600 EUR)', () => {
    const result = berechneSozialabgaben(120000, 0);
    expect(result.rentenversicherung).toBeCloseTo(8983.8, 0);
  });

  it('kinderloser Zuschlag bei 0 Kindern', () => {
    const result = berechneSozialabgaben(50000, 0);
    expect(result.pflegeversicherung).toBeCloseTo(1150, 0);
  });

  it('PV-Abschlag bei 3 Kindern', () => {
    const result = berechneSozialabgaben(50000, 3);
    expect(result.pflegeversicherung).toBeCloseTo(600, 0);
  });

  it('PV-Abschlag maximal 1.0% bei 6 Kindern', () => {
    const result = berechneSozialabgaben(50000, 6);
    expect(result.pflegeversicherung).toBeCloseTo(350, 0);
  });

  it('gibt Gesamtsumme zurück', () => {
    const result = berechneSozialabgaben(65000, 2);
    const summe = result.krankenversicherung + result.rentenversicherung
      + result.arbeitslosenversicherung + result.pflegeversicherung;
    expect(result.gesamt).toBeCloseTo(summe, 2);
  });
});
