import { useMemo } from 'react';
import type { Scenario } from '../types';
import { berechneNetto } from '../logic/calculate';
import { NettoChart } from './NettoChart';
import { CalculationDetails } from './CalculationDetails';

function formatEur(value: number): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' EUR';
}

export function ResultPanel({ scenario }: { scenario: Scenario }) {
  const result = useMemo(() => berechneNetto(scenario), [scenario]);

  const chartBrutto = scenario.hasPartner
    ? result.haushaltBrutto
    : result.person1.brutto;
  const chartNetto = scenario.hasPartner
    ? result.haushaltNetto
    : result.person1.netto;

  return (
    <div className="w-[60%] p-4 overflow-y-auto bg-gray-50">
      <div className="text-sm font-bold text-blue-600 mb-3">Ergebnisse</div>

      {/* Summary cards */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase">Brutto (Haushalt)</div>
          <div className="text-xl font-bold mt-1">{formatEur(result.haushaltBrutto)}</div>
        </div>
        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase">Netto (Haushalt)</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{formatEur(result.haushaltNetto)}</div>
        </div>
        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase">Abgabenlast</div>
          <div className="text-xl font-bold text-amber-500 mt-1">{result.abgabenlastProzent}%</div>
        </div>
      </div>

      <NettoChart scenario={scenario} currentBrutto={chartBrutto} currentNetto={chartNetto} />
      <CalculationDetails result={result} />
    </div>
  );
}
