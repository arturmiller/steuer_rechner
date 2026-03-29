const ARBEITSTAGE = 230;
const KM_SATZ_BIS_20 = 0.30;
const KM_SATZ_AB_21 = 0.38;
const ARBEITNEHMER_PAUSCHBETRAG = 1230;
const SONDERAUSGABEN_PAUSCHBETRAG = 36;

export function berechneEntfernungspauschale(fahrtstreckeKm: number): number {
  if (fahrtstreckeKm <= 0) return 0;
  const bis20 = Math.min(fahrtstreckeKm, 20);
  const ab21 = Math.max(fahrtstreckeKm - 20, 0);
  return Math.round(bis20 * ARBEITSTAGE * KM_SATZ_BIS_20 + ab21 * ARBEITSTAGE * KM_SATZ_AB_21);
}

export function berechneWerbungskosten(fahrtstreckeKm: number): number {
  return Math.max(ARBEITNEHMER_PAUSCHBETRAG, berechneEntfernungspauschale(fahrtstreckeKm));
}

export function berechneSonderausgabenpauschale(): number {
  return SONDERAUSGABEN_PAUSCHBETRAG;
}
