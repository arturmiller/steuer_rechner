import { describe, it, expect } from 'vitest';
import {
  berechneEntfernungspauschale,
  berechneWerbungskosten,
  berechneSonderausgabenpauschale,
} from '../deductions';

describe('Entfernungspauschale', () => {
  it('berechnet korrekt für <= 20 km', () => {
    expect(berechneEntfernungspauschale(15)).toBe(1035);
  });

  it('berechnet korrekt für > 20 km', () => {
    expect(berechneEntfernungspauschale(25)).toBe(1817);
  });

  it('gibt 0 zurück bei 0 km', () => {
    expect(berechneEntfernungspauschale(0)).toBe(0);
  });
});

describe('Werbungskosten', () => {
  it('nimmt Maximum aus Pauschbetrag und Entfernungspauschale', () => {
    expect(berechneWerbungskosten(15)).toBe(1230);
  });

  it('Entfernungspauschale übersteigt Pauschbetrag bei langer Strecke', () => {
    expect(berechneWerbungskosten(25)).toBe(1817);
  });
});

describe('Sonderausgabenpauschale', () => {
  it('gibt 36 EUR zurück', () => {
    expect(berechneSonderausgabenpauschale()).toBe(36);
  });
});
