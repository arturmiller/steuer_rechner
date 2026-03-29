import type { PersonResult, Result } from '../types';

function formatEur(value: number): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR';
}

function PersonDetails({ label, r }: { label: string; r: PersonResult }) {
  const monatlich = (v: number) => formatEur(v / 12);

  return (
    <div className="mb-4">
      <div className="text-xs font-bold text-blue-600 mb-2">{label} (monatlich)</div>
      <table className="w-full text-xs">
        <tbody>
          <Row label="Bruttolohn" value={monatlich(r.brutto)} />
          <Row label="- Lohnsteuer" value={monatlich(r.lohnsteuer)} negative />
          <Row label="- Solidaritätszuschlag" value={monatlich(r.soli)} negative />
          <Row label="- Kirchensteuer" value={monatlich(r.kirchensteuer)} negative />
          <Row label="- Krankenversicherung" value={monatlich(r.krankenversicherung)} negative />
          <Row label="- Rentenversicherung" value={monatlich(r.rentenversicherung)} negative />
          <Row label="- Arbeitslosenversicherung" value={monatlich(r.arbeitslosenversicherung)} negative />
          <Row label="- Pflegeversicherung" value={monatlich(r.pflegeversicherung)} negative />
          <tr className="font-bold border-t-2 border-blue-600">
            <td className="py-1.5">= Nettolohn</td>
            <td className="text-right py-1.5 text-green-600">{monatlich(r.netto)}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-2 text-[10px] text-gray-400 italic">
        Pauschalen: Werbungskosten {formatEur(r.pauschalen.werbungskosten)},
        Entfernungspauschale {formatEur(r.pauschalen.entfernungspauschale)},
        Sonderausgaben {formatEur(r.pauschalen.sonderausgaben)},
        Vorsorge {formatEur(r.pauschalen.vorsorge)}
      </div>
    </div>
  );
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <tr className="text-gray-600 border-b border-gray-100">
      <td className="py-1">{label}</td>
      <td className={`text-right py-1 ${negative ? 'text-red-600' : ''}`}>{negative ? '-' : ''}{value}</td>
    </tr>
  );
}

export function CalculationDetails({ result }: { result: Result }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="text-xs font-bold text-blue-600 mb-2">Berechnungsdetails</div>
      <PersonDetails label="Hauptverdiener" r={result.person1} />
      {result.person2 && <PersonDetails label="Ehepartner" r={result.person2} />}
      {result.person2 && (
        <div className="border-t-2 border-blue-600 pt-2 flex justify-between font-bold text-sm">
          <span>Haushalt Netto (monatlich)</span>
          <span className="text-green-600">{formatEur(result.haushaltNetto / 12)}</span>
        </div>
      )}
    </div>
  );
}
