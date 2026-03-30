import { describe, it, expect } from 'vitest';
import { berechneRentenPrognose } from '../rente';

describe('berechneRentenPrognose', () => {
  it('returns null when jahreBisRente is null', () => {
    expect(berechneRentenPrognose(65000, null)).toBeNull();
  });

  it('returns null when jahreBisRente is 0', () => {
    expect(berechneRentenPrognose(65000, 0)).toBeNull();
  });

  it('calculates correctly for 65k brutto, 20 years', () => {
    const result = berechneRentenPrognose(65000, 20);
    // Rentenpunkte/Jahr = 65000 / 50493 = 1.28731...
    // Gesamt = 1.28731 * 20 = 25.7463...
    // Monatsrente = 25.7463 * 39.32 = 1012.35...
    expect(result).not.toBeNull();
    expect(result!.rentenpunkte).toBeCloseTo(25.75, 1);
    expect(result!.monatlicherente).toBeCloseTo(1012.35, 0);
  });

  it('caps at BBG_RV (96600) for high earners', () => {
    const result = berechneRentenPrognose(150000, 10);
    const resultAtBBG = berechneRentenPrognose(96600, 10);
    // Above BBG should yield same result as exactly at BBG
    expect(result!.rentenpunkte).toBeCloseTo(resultAtBBG!.rentenpunkte, 2);
    expect(result!.monatlicherente).toBeCloseTo(resultAtBBG!.monatlicherente, 2);
  });

  it('calculates correctly for 1 year', () => {
    const result = berechneRentenPrognose(50493, 1);
    // Exactly average income = 1 Rentenpunkt/year
    expect(result!.rentenpunkte).toBeCloseTo(1.0, 2);
    expect(result!.monatlicherente).toBeCloseTo(39.32, 2);
  });

  it('returns null for negative jahreBisRente', () => {
    expect(berechneRentenPrognose(65000, -5)).toBeNull();
  });

  it('returns zero values for zero brutto', () => {
    const result = berechneRentenPrognose(0, 10);
    expect(result!.rentenpunkte).toBe(0);
    expect(result!.monatlicherente).toBe(0);
  });
});
