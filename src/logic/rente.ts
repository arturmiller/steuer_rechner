const BBG_RV = 96600;
const DURCHSCHNITTSENTGELT = 50493;
const AKTUELLER_RENTENWERT = 39.32;

export interface RentenPrognoseResult {
  rentenpunkte: number;
  monatlicherente: number;
}

export function berechneRentenPrognose(
  bruttoJahr: number,
  jahreBisRente: number | null,
): RentenPrognoseResult | null {
  if (jahreBisRente === null || jahreBisRente <= 0) return null;

  const cappedBrutto = Math.min(bruttoJahr, BBG_RV);
  const punkteProJahr = cappedBrutto / DURCHSCHNITTSENTGELT;
  const rentenpunkte = punkteProJahr * jahreBisRente;
  const monatlicherente = rentenpunkte * AKTUELLER_RENTENWERT;

  return {
    rentenpunkte: Math.round(rentenpunkte * 100) / 100,
    monatlicherente: Math.round(monatlicherente * 100) / 100,
  };
}
