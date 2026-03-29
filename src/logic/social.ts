const BBG_KV = 66150;
const BBG_RV = 96600;

const KV_SATZ = 0.073;
const KV_ZUSATZ = 0.0085;
const RV_SATZ = 0.093;
const AV_SATZ = 0.013;
const PV_BASIS = 0.017;
const PV_KINDERLOS_ZUSCHLAG = 0.006;
const PV_KIND_ABSCHLAG = 0.0025;
const PV_MAX_ABSCHLAG = 0.01;

export interface Sozialabgaben {
  krankenversicherung: number;
  rentenversicherung: number;
  arbeitslosenversicherung: number;
  pflegeversicherung: number;
  gesamt: number;
}

export function berechneSozialabgaben(bruttoJahr: number, kinder: number): Sozialabgaben {
  const basisKV = Math.min(bruttoJahr, BBG_KV);
  const basisRV = Math.min(bruttoJahr, BBG_RV);

  const krankenversicherung = basisKV * (KV_SATZ + KV_ZUSATZ);
  const rentenversicherung = basisRV * RV_SATZ;
  const arbeitslosenversicherung = basisRV * AV_SATZ;

  let pvSatz = PV_BASIS;
  if (kinder === 0) {
    pvSatz += PV_KINDERLOS_ZUSCHLAG;
  } else if (kinder >= 2) {
    const abschlag = Math.min((kinder - 1) * PV_KIND_ABSCHLAG, PV_MAX_ABSCHLAG);
    pvSatz -= abschlag;
  }
  const pflegeversicherung = basisKV * pvSatz;

  const gesamt = krankenversicherung + rentenversicherung + arbeitslosenversicherung + pflegeversicherung;

  return { krankenversicherung, rentenversicherung, arbeitslosenversicherung, pflegeversicherung, gesamt };
}
