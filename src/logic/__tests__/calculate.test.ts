import { describe, it, expect } from 'vitest';
import { berechneNetto } from '../calculate';
import type { Scenario } from '../../types';
import { createDefaultScenario } from '../../types';

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return { ...createDefaultScenario('1', 'Test'), ...overrides };
}

describe('berechneNetto', () => {
  it('berechnet Single ohne Kinder, 65k Brutto', () => {
    const scenario = makeScenario({
      person1: { bruttoJahr: 65000, fahrtstreckeKm: 25, jahreBisRente: null },
      kinder: 0,
      hasPartner: false,
    });
    const result = berechneNetto(scenario);

    expect(result.person1.brutto).toBe(65000);
    expect(result.person1.netto).toBeGreaterThan(35000);
    expect(result.person1.netto).toBeLessThan(50000);
    expect(result.person1.lohnsteuer).toBeGreaterThan(0);
    expect(result.person1.krankenversicherung).toBeGreaterThan(0);
    expect(result.person2).toBeUndefined();
    expect(result.haushaltBrutto).toBe(65000);
    expect(result.haushaltNetto).toBe(result.person1.netto);
    expect(result.abgabenlastProzent).toBeGreaterThan(20);
    expect(result.abgabenlastProzent).toBeLessThan(50);
  });

  it('berechnet Ehepaar mit Splitting', () => {
    const scenario = makeScenario({
      person1: { bruttoJahr: 65000, fahrtstreckeKm: 25, jahreBisRente: null },
      person2: { bruttoJahr: 45000, fahrtstreckeKm: 15, jahreBisRente: null },
      hasPartner: true,
      kinder: 2,
    });
    const result = berechneNetto(scenario);

    expect(result.person1.brutto).toBe(65000);
    expect(result.person2).toBeDefined();
    expect(result.person2!.brutto).toBe(45000);
    expect(result.haushaltBrutto).toBe(110000);
    expect(result.haushaltNetto).toBeCloseTo(
      result.person1.netto + result.person2!.netto, 0
    );
  });

  it('berücksichtigt Vermietungseinkünfte', () => {
    const ohneVermietung = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10, jahreBisRente: null },
      vermietungEinkuenfte: 0,
    });
    const mitVermietung = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10, jahreBisRente: null },
      vermietungEinkuenfte: 20000,
    });

    const r1 = berechneNetto(ohneVermietung);
    const r2 = berechneNetto(mitVermietung);

    expect(r2.person1.lohnsteuer).toBeGreaterThan(r1.person1.lohnsteuer);
  });

  it('negative Vermietungseinkünfte senken die Steuerlast', () => {
    const ohneVermietung = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10, jahreBisRente: null },
      vermietungEinkuenfte: 0,
    });
    const mitVerlust = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10, jahreBisRente: null },
      vermietungEinkuenfte: -10000,
    });

    const r1 = berechneNetto(ohneVermietung);
    const r2 = berechneNetto(mitVerlust);

    expect(r2.person1.lohnsteuer).toBeLessThan(r1.person1.lohnsteuer);
  });

  it('Kirchensteuer erhöht Abzüge', () => {
    const ohne = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10, jahreBisRente: null },
      kirchensteuer: false,
    });
    const mit = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10, jahreBisRente: null },
      kirchensteuer: true,
    });

    const r1 = berechneNetto(ohne);
    const r2 = berechneNetto(mit);

    expect(r2.person1.kirchensteuer).toBeGreaterThan(0);
    expect(r2.person1.netto).toBeLessThan(r1.person1.netto);
  });

  it('gibt Pauschalen korrekt zurück', () => {
    const scenario = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 25, jahreBisRente: null },
    });
    const result = berechneNetto(scenario);

    expect(result.person1.pauschalen.entfernungspauschale).toBe(1817);
    expect(result.person1.pauschalen.werbungskosten).toBe(1817);
    expect(result.person1.pauschalen.sonderausgaben).toBe(36);
    expect(result.person1.pauschalen.vorsorge).toBeGreaterThan(0);
  });

  it('0 Brutto ergibt 0 Netto', () => {
    const scenario = makeScenario({
      person1: { bruttoJahr: 0, fahrtstreckeKm: 0, jahreBisRente: null },
    });
    const result = berechneNetto(scenario);

    expect(result.person1.netto).toBe(0);
    expect(result.person1.lohnsteuer).toBe(0);
  });
});
