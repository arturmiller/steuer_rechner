import { describe, it, expect } from 'vitest';
import { berechneEinkommensteuer, berechneSoli, berechneKirchensteuer } from '../tax';

describe('Einkommensteuer 2025', () => {
  it('gibt 0 zurück unter Grundfreibetrag (12.084 EUR)', () => {
    expect(berechneEinkommensteuer(12084)).toBe(0);
    expect(berechneEinkommensteuer(10000)).toBe(0);
  });

  it('berechnet Zone 2 korrekt (12.085 – 17.005 EUR)', () => {
    const steuer = berechneEinkommensteuer(15000);
    expect(steuer).toBeGreaterThan(0);
    expect(steuer).toBeLessThan(2000);
  });

  it('berechnet Zone 3 korrekt (17.006 – 66.760 EUR)', () => {
    const steuer = berechneEinkommensteuer(40000);
    expect(steuer).toBeGreaterThan(5000);
    expect(steuer).toBeLessThan(10000);
  });

  it('berechnet Zone 4 korrekt (66.761 – 277.825 EUR)', () => {
    const steuer = berechneEinkommensteuer(100000);
    expect(steuer).toBeGreaterThan(25000);
    expect(steuer).toBeLessThan(40000);
  });

  it('berechnet Zone 5 korrekt (ab 277.826 EUR)', () => {
    const steuer = berechneEinkommensteuer(300000);
    expect(steuer).toBeGreaterThan(100000);
  });

  it('gibt 0 zurück bei negativem zvE', () => {
    expect(berechneEinkommensteuer(-5000)).toBe(0);
  });

  it('stimmt mit BMF-Referenzwert überein (40k)', () => {
    const steuer = berechneEinkommensteuer(40000);
    expect(steuer).toBeCloseTo(8452, -2);
  });

  it('stimmt mit BMF-Referenzwert überein (60k)', () => {
    const steuer = berechneEinkommensteuer(60000);
    expect(steuer).toBeCloseTo(15787, -2);
  });
});

describe('Solidaritätszuschlag', () => {
  it('gibt 0 unter Freigrenze zurück', () => {
    expect(berechneSoli(18130)).toBe(0);
    expect(berechneSoli(10000)).toBe(0);
  });

  it('berechnet 5.5% über Freigrenze', () => {
    expect(berechneSoli(20000)).toBeCloseTo(1100, 0);
  });
});

describe('Kirchensteuer', () => {
  it('berechnet 9% der Lohnsteuer', () => {
    expect(berechneKirchensteuer(10000, true)).toBeCloseTo(900, 0);
  });

  it('gibt 0 zurück wenn deaktiviert', () => {
    expect(berechneKirchensteuer(10000, false)).toBe(0);
  });
});
