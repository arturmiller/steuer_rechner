import type { Scenario, Person } from '../types';

interface Props {
  scenario: Scenario;
  onChange: (updates: Partial<Scenario>) => void;
}

function PersonInputs({
  label,
  person,
  onChange,
}: {
  label: string;
  person: Person;
  onChange: (p: Person) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="text-xs font-bold text-blue-600 mb-2">{label}</div>
      <div className="flex flex-col gap-2">
        <label className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Bruttojahresgehalt (EUR)</span>
          <input
            type="number"
            className="w-32 text-right text-sm border border-gray-300 rounded px-2 py-1 bg-gray-50"
            value={person.bruttoJahr || ''}
            onChange={(e) => onChange({ ...person, bruttoJahr: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Fahrtstrecke einfach (km)</span>
          <input
            type="number"
            className="w-32 text-right text-sm border border-gray-300 rounded px-2 py-1 bg-gray-50"
            value={person.fahrtstreckeKm || ''}
            onChange={(e) => onChange({ ...person, fahrtstreckeKm: Number(e.target.value) || 0 })}
          />
        </label>
      </div>
    </div>
  );
}

export function InputPanel({ scenario, onChange }: Props) {
  return (
    <div className="w-[40%] p-4 border-r border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="text-sm font-bold text-blue-600 mb-3">Eingaben</div>

      <PersonInputs
        label="Hauptverdiener"
        person={scenario.person1}
        onChange={(p) => onChange({ person1: p })}
      />

      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
        <div className="text-xs font-bold text-blue-600 mb-2">Gemeinsam</div>
        <div className="flex flex-col gap-2">
          <label className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Anzahl Kinder</span>
            <input
              type="number"
              min="0"
              className="w-32 text-right text-sm border border-gray-300 rounded px-2 py-1 bg-gray-50"
              value={scenario.kinder || ''}
              onChange={(e) => onChange({ kinder: Number(e.target.value) || 0 })}
            />
          </label>
          <label className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Einkünfte Vermietung (EUR/Jahr)</span>
            <input
              type="number"
              className="w-32 text-right text-sm border border-gray-300 rounded px-2 py-1 bg-gray-50"
              value={scenario.vermietungEinkuenfte || ''}
              onChange={(e) => onChange({ vermietungEinkuenfte: Number(e.target.value) || 0 })}
            />
          </label>
          <label className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Kirchensteuer (9%)</span>
            <button
              type="button"
              className={`w-10 h-5 rounded-full relative transition-colors ${
                scenario.kirchensteuer ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => onChange({ kirchensteuer: !scenario.kirchensteuer })}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                  scenario.kirchensteuer ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      <label className="flex items-center gap-2 mb-3">
        <button
          type="button"
          className={`w-10 h-5 rounded-full relative transition-colors ${
            scenario.hasPartner ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          onClick={() => onChange({ hasPartner: !scenario.hasPartner })}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
              scenario.hasPartner ? 'right-0.5' : 'left-0.5'
            }`}
          />
        </button>
        <span className="text-xs text-gray-500">Ehepartner</span>
      </label>

      {scenario.hasPartner && (
        <PersonInputs
          label="Ehepartner"
          person={scenario.person2}
          onChange={(p) => onChange({ person2: p })}
        />
      )}
    </div>
  );
}
