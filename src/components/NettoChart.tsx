import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot, Legend, ResponsiveContainer,
} from 'recharts';
import { berechneNetto } from '../logic/calculate';
import type { Scenario } from '../types';

interface Props {
  scenario: Scenario;
  currentBrutto: number;
  currentNetto: number;
}

function formatK(value: number): string {
  return `${(value / 1000).toFixed(0)}k`;
}

export function NettoChart({ scenario, currentBrutto, currentNetto }: Props) {
  const maxBrutto = scenario.hasPartner ? 200000 : 100000;

  const data = useMemo(() => {
    const points: { brutto: number; netto: number; diagonal: number }[] = [];
    for (let brutto = 0; brutto <= maxBrutto; brutto += 1000) {
      const testScenario: Scenario = {
        ...scenario,
        person1: { ...scenario.person1, bruttoJahr: brutto },
        person2: scenario.hasPartner
          ? { ...scenario.person2, bruttoJahr: brutto }
          : scenario.person2,
      };
      if (scenario.hasPartner) {
        testScenario.person2 = { ...scenario.person2, bruttoJahr: brutto };
      }
      const result = berechneNetto(testScenario);
      points.push({
        brutto,
        netto: Math.round(scenario.hasPartner ? result.haushaltNetto : result.person1.netto),
        diagonal: brutto,
      });
    }
    return points;
  }, [scenario, maxBrutto]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="text-xs font-bold text-gray-600 mb-2">
        Netto/Brutto-Kurve {scenario.hasPartner ? '(Haushalt)' : '(Single)'}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="brutto"
            tickFormatter={formatK}
            label={{ value: 'Brutto (EUR)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#999' }}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            tickFormatter={formatK}
            label={{ value: 'Netto (EUR)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#999' }}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: number) => value.toLocaleString('de-DE') + ' EUR'}
            labelFormatter={(label: number) => `Brutto: ${label.toLocaleString('de-DE')} EUR`}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="diagonal"
            stroke="#e0e0e0"
            strokeDasharray="4"
            dot={false}
            name="Brutto = Netto"
          />
          <Line
            type="monotone"
            dataKey="netto"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Nettokurve"
          />
          <ReferenceLine
            x={currentBrutto}
            stroke="#f59e0b"
            strokeDasharray="4"
            strokeWidth={1.5}
          />
          <ReferenceDot
            x={currentBrutto}
            y={currentNetto}
            r={5}
            fill="#f59e0b"
            stroke="#f59e0b"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
