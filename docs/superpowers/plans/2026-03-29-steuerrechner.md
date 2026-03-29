# Steuerrechner SPA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React SPA that calculates German net salary from gross salary (2025 tax law, Steuerklasse IV) with multiple scenarios, charts, and JSON export/import.

**Architecture:** Vite + React + TypeScript app. Calculation logic in pure functions (`src/logic/`), UI in React components, state via Zustand. Recharts for the Netto/Brutto curve. No backend.

**Tech Stack:** Vite, React 18, TypeScript, Zustand, Recharts, Tailwind CSS, Vitest

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /c/Users/Artur/Repos/steuer_rechner
npm create vite@latest . -- --template react-ts
```

Select "Ignore files and continue" if prompted about existing files.

- [ ] **Step 2: Install dependencies**

```bash
npm install zustand recharts
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Tailwind**

Replace `src/index.css` with:

```css
@import "tailwindcss";
```

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 4: Configure Vitest**

Add to `vite.config.ts` (merge with existing):

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

Add to `tsconfig.app.json` under `compilerOptions`:

```json
"types": ["vitest/globals"]
```

Add scripts to `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 5: Minimal App.tsx**

Replace `src/App.tsx`:

```tsx
function App() {
  return <div className="min-h-screen bg-gray-50 text-gray-900">Steuerrechner 2025</div>;
}

export default App;
```

- [ ] **Step 6: Verify setup**

```bash
npm run build
npm run test:run
```

Expected: Build succeeds, test runner starts (0 tests).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

### Task 2: Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create type definitions**

Create `src/types/index.ts`:

```typescript
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
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add type definitions for Scenario, Result, Person"
```

---

### Task 3: Deductions Logic (Pauschalen)

**Files:**
- Create: `src/logic/deductions.ts`, `src/logic/__tests__/deductions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/logic/__tests__/deductions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  berechneEntfernungspauschale,
  berechneWerbungskosten,
  berechneSonderausgabenpauschale,
} from '../deductions';

describe('Entfernungspauschale', () => {
  it('berechnet korrekt für <= 20 km', () => {
    // 15 km * 230 Tage * 0.30 EUR = 1035
    expect(berechneEntfernungspauschale(15)).toBe(1035);
  });

  it('berechnet korrekt für > 20 km', () => {
    // 20 * 230 * 0.30 + 5 * 230 * 0.38 = 1380 + 437 = 1817
    expect(berechneEntfernungspauschale(25)).toBe(1817);
  });

  it('gibt 0 zurück bei 0 km', () => {
    expect(berechneEntfernungspauschale(0)).toBe(0);
  });
});

describe('Werbungskosten', () => {
  it('nimmt Maximum aus Pauschbetrag und Entfernungspauschale', () => {
    // 15 km → Entfernung 1035, Pauschbetrag 1230 → 1230
    expect(berechneWerbungskosten(15)).toBe(1230);
  });

  it('Entfernungspauschale übersteigt Pauschbetrag bei langer Strecke', () => {
    // 25 km → Entfernung 1817 > 1230 → 1817
    expect(berechneWerbungskosten(25)).toBe(1817);
  });
});

describe('Sonderausgabenpauschale', () => {
  it('gibt 36 EUR zurück', () => {
    expect(berechneSonderausgabenpauschale()).toBe(36);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/logic/__tests__/deductions.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement deductions**

Create `src/logic/deductions.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/logic/__tests__/deductions.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/deductions.ts src/logic/__tests__/deductions.test.ts
git commit -m "feat: add deductions logic (Pauschalen)"
```

---

### Task 4: Social Insurance Logic (Sozialversicherung)

**Files:**
- Create: `src/logic/social.ts`, `src/logic/__tests__/social.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/logic/__tests__/social.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { berechneSozialabgaben } from '../social';

describe('Sozialabgaben', () => {
  it('berechnet korrekt für 65.000 EUR Brutto, 2 Kinder', () => {
    const result = berechneSozialabgaben(65000, 2);
    // KV: 65000 * (0.073 + 0.0085) = 5297.50
    expect(result.krankenversicherung).toBeCloseTo(5297.5, 0);
    // RV: 65000 * 0.093 = 6045
    expect(result.rentenversicherung).toBeCloseTo(6045, 0);
    // AV: 65000 * 0.013 = 845
    expect(result.arbeitslosenversicherung).toBeCloseTo(845, 0);
    // PV: 2 Kinder → Basissatz 1.7% - 0% (Abschlag erst ab 2. Kind = 0.25%) = 1.45%
    // 65000 * 0.0145 = 942.50
    expect(result.pflegeversicherung).toBeCloseTo(942.5, 0);
  });

  it('berücksichtigt BBG für KV (66.150 EUR)', () => {
    const result = berechneSozialabgaben(80000, 0);
    // KV capped at 66150: 66150 * 0.0815 = 5391.23
    expect(result.krankenversicherung).toBeCloseTo(5391.23, 0);
  });

  it('berücksichtigt BBG für RV (96.600 EUR)', () => {
    const result = berechneSozialabgaben(120000, 0);
    // RV capped at 96600: 96600 * 0.093 = 8983.80
    expect(result.rentenversicherung).toBeCloseTo(8983.8, 0);
  });

  it('kinderloser Zuschlag bei 0 Kindern', () => {
    const result = berechneSozialabgaben(50000, 0);
    // PV: 50000 * (0.017 + 0.006) = 50000 * 0.023 = 1150
    expect(result.pflegeversicherung).toBeCloseTo(1150, 0);
  });

  it('PV-Abschlag bei 3 Kindern', () => {
    const result = berechneSozialabgaben(50000, 3);
    // Basissatz 1.7% - 0.50% (2 Kinder Abschlag: 2*0.25%) = 1.2%
    // 50000 * 0.012 = 600
    expect(result.pflegeversicherung).toBeCloseTo(600, 0);
  });

  it('PV-Abschlag maximal 1.0% bei 6 Kindern', () => {
    const result = berechneSozialabgaben(50000, 6);
    // Basissatz 1.7% - 1.0% (max) = 0.7%
    // 50000 * 0.007 = 350
    expect(result.pflegeversicherung).toBeCloseTo(350, 0);
  });

  it('gibt Gesamtsumme zurück', () => {
    const result = berechneSozialabgaben(65000, 2);
    const summe = result.krankenversicherung + result.rentenversicherung
      + result.arbeitslosenversicherung + result.pflegeversicherung;
    expect(result.gesamt).toBeCloseTo(summe, 2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/logic/__tests__/social.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement social insurance**

Create `src/logic/social.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/logic/__tests__/social.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/social.ts src/logic/__tests__/social.test.ts
git commit -m "feat: add social insurance calculation (KV, RV, AV, PV)"
```

---

### Task 5: Income Tax Logic (Einkommensteuer)

**Files:**
- Create: `src/logic/tax.ts`, `src/logic/__tests__/tax.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/logic/__tests__/tax.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { berechneEinkommensteuer, berechneSoli, berechneKirchensteuer } from '../tax';

describe('Einkommensteuer 2025', () => {
  it('gibt 0 zurück unter Grundfreibetrag (12.084 EUR)', () => {
    expect(berechneEinkommensteuer(12084)).toBe(0);
    expect(berechneEinkommensteuer(10000)).toBe(0);
  });

  it('berechnet Zone 2 korrekt (12.085 – 17.005 EUR)', () => {
    // zvE = 15000 → Zone 2
    const steuer = berechneEinkommensteuer(15000);
    expect(steuer).toBeGreaterThan(0);
    expect(steuer).toBeLessThan(2000);
  });

  it('berechnet Zone 3 korrekt (17.006 – 66.760 EUR)', () => {
    const steuer = berechneEinkommensteuer(40000);
    expect(steuer).toBeGreaterThan(5000);
    expect(steuer).toBeLessThan(10000);
  });

  it('berechnet Zone 4 korrekt (66.761 – 277.825 EUR)', () => {
    const steuer = berechneEinkommensteuer(100000);
    expect(steuer).toBeGreaterThan(25000);
    expect(steuer).toBeLessThan(40000);
  });

  it('berechnet Zone 5 korrekt (ab 277.826 EUR)', () => {
    const steuer = berechneEinkommensteuer(300000);
    expect(steuer).toBeGreaterThan(100000);
  });

  it('gibt 0 zurück bei negativem zvE', () => {
    expect(berechneEinkommensteuer(-5000)).toBe(0);
  });

  // Referenzwert: 40.000 EUR zvE → ca. 8.452 EUR ESt (BMF-Rechner)
  it('stimmt mit BMF-Referenzwert überein (40k)', () => {
    const steuer = berechneEinkommensteuer(40000);
    expect(steuer).toBeCloseTo(8452, -2); // ±100 EUR Toleranz
  });

  // Referenzwert: 60.000 EUR zvE → ca. 15.787 EUR ESt
  it('stimmt mit BMF-Referenzwert überein (60k)', () => {
    const steuer = berechneEinkommensteuer(60000);
    expect(steuer).toBeCloseTo(15787, -2);
  });
});

describe('Solidaritätszuschlag', () => {
  it('gibt 0 unter Freigrenze zurück', () => {
    expect(berechneSoli(18130)).toBe(0);
    expect(berechneSoli(10000)).toBe(0);
  });

  it('berechnet 5.5% über Freigrenze', () => {
    expect(berechneSoli(20000)).toBeCloseTo(1100, 0);
  });
});

describe('Kirchensteuer', () => {
  it('berechnet 9% der Lohnsteuer', () => {
    expect(berechneKirchensteuer(10000, true)).toBeCloseTo(900, 0);
  });

  it('gibt 0 zurück wenn deaktiviert', () => {
    expect(berechneKirchensteuer(10000, false)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/logic/__tests__/tax.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement tax calculation**

Create `src/logic/tax.ts`:

```typescript
/**
 * Einkommensteuer-Tarif 2025 nach §32a EStG.
 * Formeln aus dem Einkommensteuergesetz 2025.
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
    return Math.floor((181.19 * y + 2397) * y + 966.53);
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/logic/__tests__/tax.test.ts
```

Expected: All 10 tests PASS. If BMF reference values are slightly off, adjust tolerance.

- [ ] **Step 5: Commit**

```bash
git add src/logic/tax.ts src/logic/__tests__/tax.test.ts
git commit -m "feat: add income tax calculation (EStG 2025, Soli, KiSt)"
```

---

### Task 6: Main Calculation Function

**Files:**
- Create: `src/logic/calculate.ts`, `src/logic/__tests__/calculate.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/logic/__tests__/calculate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { berechneNetto } from '../calculate';
import type { Scenario } from '../../types';
import { createDefaultScenario } from '../../types';

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return { ...createDefaultScenario('1', 'Test'), ...overrides };
}

describe('berechneNetto', () => {
  it('berechnet Single ohne Kinder, 65k Brutto', () => {
    const scenario = makeScenario({
      person1: { bruttoJahr: 65000, fahrtstreckeKm: 25 },
      kinder: 0,
      hasPartner: false,
    });
    const result = berechneNetto(scenario);

    expect(result.person1.brutto).toBe(65000);
    expect(result.person1.netto).toBeGreaterThan(35000);
    expect(result.person1.netto).toBeLessThan(50000);
    expect(result.person1.lohnsteuer).toBeGreaterThan(0);
    expect(result.person1.krankenversicherung).toBeGreaterThan(0);
    expect(result.person2).toBeUndefined();
    expect(result.haushaltBrutto).toBe(65000);
    expect(result.haushaltNetto).toBe(result.person1.netto);
    expect(result.abgabenlastProzent).toBeGreaterThan(20);
    expect(result.abgabenlastProzent).toBeLessThan(50);
  });

  it('berechnet Ehepaar mit Splitting', () => {
    const scenario = makeScenario({
      person1: { bruttoJahr: 65000, fahrtstreckeKm: 25 },
      person2: { bruttoJahr: 45000, fahrtstreckeKm: 15 },
      hasPartner: true,
      kinder: 2,
    });
    const result = berechneNetto(scenario);

    expect(result.person1.brutto).toBe(65000);
    expect(result.person2).toBeDefined();
    expect(result.person2!.brutto).toBe(45000);
    expect(result.haushaltBrutto).toBe(110000);
    expect(result.haushaltNetto).toBeCloseTo(
      result.person1.netto + result.person2!.netto, 0
    );
  });

  it('berücksichtigt Vermietungseinkünfte', () => {
    const ohneVermietung = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10 },
      vermietungEinkuenfte: 0,
    });
    const mitVermietung = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10 },
      vermietungEinkuenfte: 20000,
    });

    const r1 = berechneNetto(ohneVermietung);
    const r2 = berechneNetto(mitVermietung);

    // Mehr Einkünfte → höhere Steuer → niedrigeres Netto
    expect(r2.person1.lohnsteuer).toBeGreaterThan(r1.person1.lohnsteuer);
  });

  it('negative Vermietungseinkünfte senken die Steuerlast', () => {
    const ohneVermietung = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10 },
      vermietungEinkuenfte: 0,
    });
    const mitVerlust = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10 },
      vermietungEinkuenfte: -10000,
    });

    const r1 = berechneNetto(ohneVermietung);
    const r2 = berechneNetto(mitVerlust);

    expect(r2.person1.lohnsteuer).toBeLessThan(r1.person1.lohnsteuer);
  });

  it('Kirchensteuer erhöht Abzüge', () => {
    const ohne = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10 },
      kirchensteuer: false,
    });
    const mit = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 10 },
      kirchensteuer: true,
    });

    const r1 = berechneNetto(ohne);
    const r2 = berechneNetto(mit);

    expect(r2.person1.kirchensteuer).toBeGreaterThan(0);
    expect(r2.person1.netto).toBeLessThan(r1.person1.netto);
  });

  it('gibt Pauschalen korrekt zurück', () => {
    const scenario = makeScenario({
      person1: { bruttoJahr: 50000, fahrtstreckeKm: 25 },
    });
    const result = berechneNetto(scenario);

    expect(result.person1.pauschalen.entfernungspauschale).toBe(1817);
    expect(result.person1.pauschalen.werbungskosten).toBe(1817);
    expect(result.person1.pauschalen.sonderausgaben).toBe(36);
    expect(result.person1.pauschalen.vorsorge).toBeGreaterThan(0);
  });

  it('0 Brutto ergibt 0 Netto', () => {
    const scenario = makeScenario({
      person1: { bruttoJahr: 0, fahrtstreckeKm: 0 },
    });
    const result = berechneNetto(scenario);

    expect(result.person1.netto).toBe(0);
    expect(result.person1.lohnsteuer).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/logic/__tests__/calculate.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement calculate**

Create `src/logic/calculate.ts`:

```typescript
import type { Scenario, PersonResult, Result, Person } from '../types';
import { berechneWerbungskosten, berechneEntfernungspauschale, berechneSonderausgabenpauschale } from './deductions';
import { berechneSozialabgaben } from './social';
import { berechneEinkommensteuer, berechneSoli, berechneKirchensteuer } from './tax';

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
    };
  }

  // Sozialabgaben (auf Brutto der Person)
  const sozial = berechneSozialabgaben(brutto, kinder);

  // Pauschalen
  const entfernungspauschale = berechneEntfernungspauschale(person.fahrtstreckeKm);
  const werbungskosten = berechneWerbungskosten(person.fahrtstreckeKm);
  const sonderausgaben = berechneSonderausgabenpauschale();
  const vorsorge = sozial.gesamt;

  // zvE der Person
  const personZvE = brutto + vermietungEinkuenfteAnteil - werbungskosten - sonderausgaben - vorsorge;

  let lohnsteuer: number;

  if (splitting && partnerPerson) {
    // Ehegattensplitting: beide zvE zusammen, halbieren, Steuer verdoppeln
    const partnerSozial = berechneSozialabgaben(partnerPerson.bruttoJahr, kinder);
    const partnerWerbungskosten = berechneWerbungskosten(partnerPerson.fahrtstreckeKm);
    const partnerSonderausgaben = berechneSonderausgabenpauschale();
    const partnerVorsorge = partnerSozial.gesamt;
    const partnerZvE = partnerPerson.bruttoJahr + vermietungEinkuenfteAnteil
      - partnerWerbungskosten - partnerSonderausgaben - partnerVorsorge;

    const gemeinsamZvE = personZvE + partnerZvE;
    const halbZvE = gemeinsamZvE / 2;
    lohnsteuer = berechneEinkommensteuer(halbZvE) * 2;

    // Aufteilung proportional zum Brutto
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/logic/__tests__/calculate.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/calculate.ts src/logic/__tests__/calculate.test.ts
git commit -m "feat: add main calculation function (berechneNetto)"
```

---

### Task 7: Zustand Store

**Files:**
- Create: `src/store/scenarioStore.ts`, `src/store/__tests__/scenarioStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/store/__tests__/scenarioStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useScenarioStore } from '../scenarioStore';

describe('scenarioStore', () => {
  beforeEach(() => {
    useScenarioStore.setState({
      scenarios: [],
      activeScenarioId: '',
    });
    useScenarioStore.getState().addScenario();
  });

  it('starts with one default scenario', () => {
    const state = useScenarioStore.getState();
    expect(state.scenarios).toHaveLength(1);
    expect(state.activeScenarioId).toBe(state.scenarios[0].id);
  });

  it('adds a new scenario', () => {
    useScenarioStore.getState().addScenario();
    const state = useScenarioStore.getState();
    expect(state.scenarios).toHaveLength(2);
    expect(state.activeScenarioId).toBe(state.scenarios[1].id);
  });

  it('removes a scenario', () => {
    useScenarioStore.getState().addScenario();
    const state = useScenarioStore.getState();
    const idToRemove = state.scenarios[0].id;
    useScenarioStore.getState().removeScenario(idToRemove);
    const updated = useScenarioStore.getState();
    expect(updated.scenarios).toHaveLength(1);
    expect(updated.scenarios[0].id).not.toBe(idToRemove);
  });

  it('does not remove the last scenario', () => {
    const state = useScenarioStore.getState();
    useScenarioStore.getState().removeScenario(state.scenarios[0].id);
    expect(useScenarioStore.getState().scenarios).toHaveLength(1);
  });

  it('renames a scenario', () => {
    const state = useScenarioStore.getState();
    const id = state.scenarios[0].id;
    useScenarioStore.getState().renameScenario(id, 'Teilzeit');
    expect(useScenarioStore.getState().scenarios[0].name).toBe('Teilzeit');
  });

  it('updates a scenario', () => {
    const state = useScenarioStore.getState();
    const id = state.scenarios[0].id;
    useScenarioStore.getState().updateScenario(id, { kinder: 3 });
    expect(useScenarioStore.getState().scenarios[0].kinder).toBe(3);
  });

  it('sets active scenario', () => {
    useScenarioStore.getState().addScenario();
    const state = useScenarioStore.getState();
    const firstId = state.scenarios[0].id;
    useScenarioStore.getState().setActiveScenario(firstId);
    expect(useScenarioStore.getState().activeScenarioId).toBe(firstId);
  });

  it('loads scenarios from import', () => {
    const imported = [
      { id: 'x', name: 'Imported', person1: { bruttoJahr: 50000, fahrtstreckeKm: 10 }, hasPartner: false, person2: { bruttoJahr: 0, fahrtstreckeKm: 0 }, kinder: 1, vermietungEinkuenfte: 0, kirchensteuer: false },
    ];
    useScenarioStore.getState().loadScenarios(imported);
    const state = useScenarioStore.getState();
    expect(state.scenarios).toHaveLength(1);
    expect(state.scenarios[0].name).toBe('Imported');
    expect(state.activeScenarioId).toBe('x');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/store/__tests__/scenarioStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement store**

Create `src/store/scenarioStore.ts`:

```typescript
import { create } from 'zustand';
import type { Scenario } from '../types';
import { createDefaultScenario } from '../types';

interface ScenarioStore {
  scenarios: Scenario[];
  activeScenarioId: string;
  addScenario: () => void;
  removeScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  setActiveScenario: (id: string) => void;
  loadScenarios: (scenarios: Scenario[]) => void;
}

let counter = 0;
function nextId(): string {
  return `scenario-${++counter}-${Date.now()}`;
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  scenarios: [],
  activeScenarioId: '',

  addScenario: () =>
    set((state) => {
      const id = nextId();
      const name = `Szenario ${state.scenarios.length + 1}`;
      const scenario = createDefaultScenario(id, name);
      return {
        scenarios: [...state.scenarios, scenario],
        activeScenarioId: id,
      };
    }),

  removeScenario: (id) =>
    set((state) => {
      if (state.scenarios.length <= 1) return state;
      const filtered = state.scenarios.filter((s) => s.id !== id);
      const activeId = state.activeScenarioId === id
        ? filtered[0].id
        : state.activeScenarioId;
      return { scenarios: filtered, activeScenarioId: activeId };
    }),

  renameScenario: (id, name) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) => (s.id === id ? { ...s, name } : s)),
    })),

  updateScenario: (id, updates) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  setActiveScenario: (id) => set({ activeScenarioId: id }),

  loadScenarios: (scenarios) =>
    set({
      scenarios,
      activeScenarioId: scenarios.length > 0 ? scenarios[0].id : '',
    }),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/store/__tests__/scenarioStore.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/scenarioStore.ts src/store/__tests__/scenarioStore.test.ts
git commit -m "feat: add Zustand scenario store (CRUD, tabs, import)"
```

---

### Task 8: JSON File I/O

**Files:**
- Create: `src/utils/fileIO.ts`, `src/utils/__tests__/fileIO.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/__tests__/fileIO.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { scenariosToJson, jsonToScenarios } from '../fileIO';
import { createDefaultScenario } from '../../types';

describe('fileIO', () => {
  it('serializes scenarios to JSON string', () => {
    const scenarios = [createDefaultScenario('1', 'Test')];
    const json = scenariosToJson(scenarios);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Test');
  });

  it('deserializes JSON string to scenarios', () => {
    const scenarios = [createDefaultScenario('1', 'Test')];
    const json = scenariosToJson(scenarios);
    const result = jsonToScenarios(json);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test');
    expect(result[0].person1.bruttoJahr).toBe(0);
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToScenarios('not json')).toThrow();
  });

  it('throws on invalid structure', () => {
    expect(() => jsonToScenarios('[{"invalid": true}]')).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/__tests__/fileIO.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement fileIO**

Create `src/utils/fileIO.ts`:

```typescript
import type { Scenario } from '../types';

export function scenariosToJson(scenarios: Scenario[]): string {
  return JSON.stringify(scenarios, null, 2);
}

export function jsonToScenarios(json: string): Scenario[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error('Ungültiges Format: Array erwartet');
  }
  for (const item of parsed) {
    if (typeof item.id !== 'string' || typeof item.name !== 'string' || !item.person1) {
      throw new Error('Ungültiges Szenario-Format');
    }
  }
  return parsed as Scenario[];
}

export function downloadJson(scenarios: Scenario[], filename = 'steuerrechner.json'): void {
  const json = scenariosToJson(scenarios);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function uploadJson(): Promise<Scenario[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('Keine Datei ausgewählt'));
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const scenarios = jsonToScenarios(reader.result as string);
          resolve(scenarios);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/__tests__/fileIO.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/fileIO.ts src/utils/__tests__/fileIO.test.ts
git commit -m "feat: add JSON export/import for scenarios"
```

---

### Task 9: Header Component

**Files:**
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Create Header**

Create `src/components/Header.tsx`:

```tsx
import { useScenarioStore } from '../store/scenarioStore';
import { downloadJson, uploadJson } from '../utils/fileIO';

export function Header() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const loadScenarios = useScenarioStore((s) => s.loadScenarios);

  const handleSave = () => {
    downloadJson(scenarios);
  };

  const handleLoad = async () => {
    try {
      const imported = await uploadJson();
      loadScenarios(imported);
    } catch {
      alert('Fehler beim Laden der Datei.');
    }
  };

  return (
    <header className="bg-white border-b-2 border-gray-200 px-5 py-3 flex justify-between items-center">
      <h1 className="text-lg font-bold text-blue-600">Steuerrechner 2025</h1>
      <div className="flex gap-2">
        <button
          onClick={handleLoad}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          Laden
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Speichern
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add Header component with save/load buttons"
```

---

### Task 10: TabBar Component

**Files:**
- Create: `src/components/TabBar.tsx`

- [ ] **Step 1: Create TabBar**

Create `src/components/TabBar.tsx`:

```tsx
import { useState } from 'react';
import { useScenarioStore } from '../store/scenarioStore';

export function TabBar() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const activeId = useScenarioStore((s) => s.activeScenarioId);
  const setActive = useScenarioStore((s) => s.setActiveScenario);
  const addScenario = useScenarioStore((s) => s.addScenario);
  const removeScenario = useScenarioStore((s) => s.removeScenario);
  const renameScenario = useScenarioStore((s) => s.renameScenario);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const finishEditing = () => {
    if (editingId && editValue.trim()) {
      renameScenario(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center bg-white px-3 border-b border-gray-200 overflow-x-auto">
      {scenarios.map((s) => (
        <div
          key={s.id}
          className={`flex items-center gap-1 px-4 py-2 text-sm cursor-pointer border-b-2 whitespace-nowrap ${
            s.id === activeId
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActive(s.id)}
          onDoubleClick={() => startEditing(s.id, s.name)}
        >
          {editingId === s.id ? (
            <input
              className="w-28 text-sm border border-blue-400 rounded px-1 py-0.5"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span>{s.name}</span>
          )}
          {scenarios.length > 1 && (
            <button
              className="ml-1 text-gray-400 hover:text-red-500 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                removeScenario(s.id);
              }}
            >
              x
            </button>
          )}
        </div>
      ))}
      <button
        className="px-3 py-2 text-blue-600 font-bold hover:bg-gray-50"
        onClick={addScenario}
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TabBar.tsx
git commit -m "feat: add TabBar component with rename, add, remove"
```

---

### Task 11: InputPanel Component

**Files:**
- Create: `src/components/InputPanel.tsx`

- [ ] **Step 1: Create InputPanel**

Create `src/components/InputPanel.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/InputPanel.tsx
git commit -m "feat: add InputPanel component (person inputs, toggles)"
```

---

### Task 12: CalculationDetails Component

**Files:**
- Create: `src/components/CalculationDetails.tsx`

- [ ] **Step 1: Create CalculationDetails**

Create `src/components/CalculationDetails.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CalculationDetails.tsx
git commit -m "feat: add CalculationDetails component (monthly breakdown)"
```

---

### Task 13: NettoChart Component

**Files:**
- Create: `src/components/NettoChart.tsx`

- [ ] **Step 1: Create NettoChart**

Create `src/components/NettoChart.tsx`:

```tsx
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
        // Für verheiratete: X-Achse = Haushaltbrutto, also beide gleich
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
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/NettoChart.tsx
git commit -m "feat: add NettoChart component (Recharts Netto/Brutto curve)"
```

---

### Task 14: ResultPanel Component

**Files:**
- Create: `src/components/ResultPanel.tsx`

- [ ] **Step 1: Create ResultPanel**

Create `src/components/ResultPanel.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ResultPanel.tsx
git commit -m "feat: add ResultPanel component (summary, chart, details)"
```

---

### Task 15: Wire Up App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Wire everything together**

Replace `src/App.tsx`:

```tsx
import { useEffect } from 'react';
import { useScenarioStore } from './store/scenarioStore';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { InputPanel } from './components/InputPanel';
import { ResultPanel } from './components/ResultPanel';

function App() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const activeId = useScenarioStore((s) => s.activeScenarioId);
  const updateScenario = useScenarioStore((s) => s.updateScenario);
  const addScenario = useScenarioStore((s) => s.addScenario);

  useEffect(() => {
    if (scenarios.length === 0) {
      addScenario();
    }
  }, [scenarios.length, addScenario]);

  const activeScenario = scenarios.find((s) => s.id === activeId);

  if (!activeScenario) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <Header />
      <TabBar />
      <div className="flex flex-1 overflow-hidden">
        <InputPanel
          scenario={activeScenario}
          onChange={(updates) => updateScenario(activeId, updates)}
        />
        <ResultPanel scenario={activeScenario} />
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Clean up default files**

Delete the following files if they exist (Vite scaffold leftovers):

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire up App with all components, clean up scaffold"
```

---

### Task 16: Manual Smoke Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify in browser**

Open the URL shown by Vite (usually http://localhost:5173). Check:

1. App loads with one default tab "Szenario 1"
2. Enter 65000 as Bruttojahresgehalt → results update live
3. Toggle Ehepartner → partner inputs appear
4. Enter partner salary → Splitting changes results
5. Chart shows correct axis range (100k single, 200k married)
6. Add new tab with + → new empty scenario
7. Double-click tab name → rename works
8. Speichern → downloads JSON file
9. Laden → upload JSON file restores scenarios

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Final commit if fixes were made**

```bash
git add -A
git commit -m "fix: address issues found in smoke test"
```
