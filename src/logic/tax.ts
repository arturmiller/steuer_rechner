/**
 * Einkommensteuer-Tarif 2025 nach §32a EStG.
 */
export function berechneEinkommensteuer(zvE: number): number {
  if (zvE <= 0) return 0;

  const z = Math.floor(zvE);

  if (z <= 12084) {
    return 0;
  } else if (z <= 17005) {
    const y = (z - 12084) / 10000;
    return Math.floor(922.98 * y + 1400) * y;
  } else if (z <= 66760) {
    const y = (z - 17005) / 10000;
    return Math.floor((192.53 * y + 2397) * y + 1922.06);
  } else if (z <= 277825) {
    return Math.floor(0.42 * z - 10636.31);
  } else {
    return Math.floor(0.45 * z - 18971.56);
  }
}

const SOLI_FREIGRENZE = 18130;
const SOLI_SATZ = 0.055;

export function berechneSoli(lohnsteuer: number): number {
  if (lohnsteuer <= SOLI_FREIGRENZE) return 0;
  return Math.round(lohnsteuer * SOLI_SATZ * 100) / 100;
}

const KIRCHENSTEUER_SATZ = 0.09;

export function berechneKirchensteuer(lohnsteuer: number, aktiv: boolean): number {
  if (!aktiv) return 0;
  return Math.round(lohnsteuer * KIRCHENSTEUER_SATZ * 100) / 100;
}
