import type { Scenario, PersonResult, Result, Person } from '../types';
import { berechneWerbungskosten, berechneEntfernungspauschale, berechneSonderausgabenpauschale } from './deductions';
import { berechneSozialabgaben } from './social';
import { berechneEinkommensteuer, berechneSoli, berechneKirchensteuer } from './tax';
import { berechneRentenPrognose } from './rente';

function berechnePersonErgebnis(
  person: Person,
  kinder: number,
  kirchensteuerAktiv: boolean,
  vermietungEinkuenfteAnteil: number,
  splitting: boolean,
  partnerPerson?: Person,
): PersonResult {
  const brutto = person.bruttoJahr;

  if (brutto <= 0 && vermietungEinkuenfteAnteil <= 0) {
    return {
      brutto,
      zvE: 0,
      lohnsteuer: 0,
      soli: 0,
      kirchensteuer: 0,
      krankenversicherung: 0,
      rentenversicherung: 0,
      arbeitslosenversicherung: 0,
      pflegeversicherung: 0,
      netto: 0,
      pauschalen: { werbungskosten: 0, entfernungspauschale: 0, sonderausgaben: 0, vorsorge: 0 },
      rentenPrognose: null,
    };
  }

  const sozial = berechneSozialabgaben(brutto, kinder);

  const entfernungspauschale = berechneEntfernungspauschale(person.fahrtstreckeKm);
  const werbungskosten = berechneWerbungskosten(person.fahrtstreckeKm);
  const sonderausgaben = berechneSonderausgabenpauschale();
  const vorsorge = sozial.gesamt;

  const personZvE = brutto + vermietungEinkuenfteAnteil - werbungskosten - sonderausgaben - vorsorge;

  let lohnsteuer: number;

  if (splitting && partnerPerson) {
    const partnerSozial = berechneSozialabgaben(partnerPerson.bruttoJahr, kinder);
    const partnerWerbungskosten = berechneWerbungskosten(partnerPerson.fahrtstreckeKm);
    const partnerSonderausgaben = berechneSonderausgabenpauschale();
    const partnerVorsorge = partnerSozial.gesamt;
    const partnerZvE = partnerPerson.bruttoJahr + vermietungEinkuenfteAnteil
      - partnerWerbungskosten - partnerSonderausgaben - partnerVorsorge;

    const gemeinsamZvE = personZvE + partnerZvE;
    const halbZvE = gemeinsamZvE / 2;
    lohnsteuer = berechneEinkommensteuer(halbZvE) * 2;

    const gesamtBrutto = brutto + partnerPerson.bruttoJahr;
    if (gesamtBrutto > 0) {
      lohnsteuer = lohnsteuer * (brutto / gesamtBrutto);
    } else {
      lohnsteuer = 0;
    }
  } else {
    lohnsteuer = berechneEinkommensteuer(personZvE);
  }

  lohnsteuer = Math.max(0, Math.round(lohnsteuer * 100) / 100);

  const soli = berechneSoli(lohnsteuer);
  const kirchensteuer = berechneKirchensteuer(lohnsteuer, kirchensteuerAktiv);

  const netto = brutto - sozial.gesamt - lohnsteuer - soli - kirchensteuer;

  const rentenPrognose = berechneRentenPrognose(brutto, person.jahreBisRente);

  return {
    brutto,
    zvE: Math.max(0, personZvE),
    lohnsteuer,
    soli,
    kirchensteuer,
    krankenversicherung: sozial.krankenversicherung,
    rentenversicherung: sozial.rentenversicherung,
    arbeitslosenversicherung: sozial.arbeitslosenversicherung,
    pflegeversicherung: sozial.pflegeversicherung,
    netto: Math.round(netto * 100) / 100,
    pauschalen: { werbungskosten, entfernungspauschale, sonderausgaben, vorsorge },
    rentenPrognose,
  };
}

export function berechneNetto(scenario: Scenario): Result {
  const vermietungAnteil = scenario.hasPartner
    ? scenario.vermietungEinkuenfte / 2
    : scenario.vermietungEinkuenfte;

  const person1Result = berechnePersonErgebnis(
    scenario.person1,
    scenario.kinder,
    scenario.kirchensteuer,
    vermietungAnteil,
    scenario.hasPartner,
    scenario.hasPartner ? scenario.person2 : undefined,
  );

  let person2Result: PersonResult | undefined;
  if (scenario.hasPartner) {
    person2Result = berechnePersonErgebnis(
      scenario.person2,
      scenario.kinder,
      scenario.kirchensteuer,
      vermietungAnteil,
      true,
      scenario.person1,
    );
  }

  const haushaltBrutto = person1Result.brutto + (person2Result?.brutto ?? 0);
  const haushaltNetto = person1Result.netto + (person2Result?.netto ?? 0);
  const abgabenlastProzent = haushaltBrutto > 0
    ? Math.round((1 - haushaltNetto / haushaltBrutto) * 10000) / 100
    : 0;

  return {
    person1: person1Result,
    person2: person2Result,
    haushaltBrutto,
    haushaltNetto,
    abgabenlastProzent,
  };
}
