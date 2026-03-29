export interface Person {
  bruttoJahr: number;
  fahrtstreckeKm: number;
}

export interface Scenario {
  id: string;
  name: string;
  person1: Person;
  hasPartner: boolean;
  person2: Person;
  kinder: number;
  vermietungEinkuenfte: number;
  kirchensteuer: boolean;
}

export interface Pauschalen {
  werbungskosten: number;
  entfernungspauschale: number;
  sonderausgaben: number;
  vorsorge: number;
}

export interface PersonResult {
  brutto: number;
  zvE: number;
  lohnsteuer: number;
  soli: number;
  kirchensteuer: number;
  krankenversicherung: number;
  rentenversicherung: number;
  arbeitslosenversicherung: number;
  pflegeversicherung: number;
  netto: number;
  pauschalen: Pauschalen;
}

export interface Result {
  person1: PersonResult;
  person2?: PersonResult;
  haushaltBrutto: number;
  haushaltNetto: number;
  abgabenlastProzent: number;
}

export function createDefaultPerson(): Person {
  return { bruttoJahr: 0, fahrtstreckeKm: 0 };
}

export function createDefaultScenario(id: string, name: string): Scenario {
  return {
    id,
    name,
    person1: createDefaultPerson(),
    hasPartner: false,
    person2: createDefaultPerson(),
    kinder: 0,
    vermietungEinkuenfte: 0,
    kirchensteuer: false,
  };
}
