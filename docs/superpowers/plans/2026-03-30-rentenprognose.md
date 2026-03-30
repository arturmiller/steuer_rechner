# Rentenprognose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calculate projected pension (Rente) earned over the next X years, per person, based on the German pension point system with 2025 values.

**Architecture:** Add `jahreBisRente` to the `Person` type, create a pure calculation module `rente.ts`, wire it into `berechneNetto()`, and display results as conditional summary cards in the ResultPanel.

**Tech Stack:** TypeScript, React, Vitest, Zustand, TailwindCSS

---

## File Structure

| File | Role |
|------|------|
| `src/types/index.ts` | Add `jahreBisRente` to `Person`, add `RentenPrognose` type, extend `PersonResult` |
| `src/logic/rente.ts` | **New** — pure function `berechneRentenPrognose(bruttoJahr, jahreBisRente)` |
| `src/logic/__tests__/rente.test.ts` | **New** — unit tests for rente.ts |
| `src/logic/calculate.ts` | Call `berechneRentenPrognose` and attach result to `PersonResult` |
| `src/components/InputPanel.tsx` | Add optional "Jahre bis zur Rente" field per person |
| `src/components/ResultPanel.tsx` | Add conditional summary card(s) for Rentenprognose |
| `src/store/scenarioStore.ts` | No changes needed (uses `createDefaultPerson` from types) |

---

### Task 1: Extend Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `RentenPrognose` interface and extend `Person` and `PersonResult`**

In `src/types/index.ts`, add the `RentenPrognose` interface after `Pauschalen`, extend `Person` with `jahreBisRente`, and extend `PersonResult` with `rentenPrognose`:

```typescript
// Add to Person interface (after fahrtstreckeKm):
  jahreBisRente: number | null;

// Add new interface (after Pauschalen):
export interface RentenPrognose {
  rentenpunkte: number;
  monatlicherente: number;
}

// Add to PersonResult interface (after pauschalen):
  rentenPrognose: RentenPrognose | null;
```

- [ ] **Step 2: Update `createDefaultPerson` to include `jahreBisRente: null`**

```typescript
export function createDefaultPerson(): Person {
  return { bruttoJahr: 0, fahrtstreckeKm: 0, jahreBisRente: null };
}
```

- [ ] **Step 3: Run type check to see what breaks**

Run: `npx tsc --noEmit`
Expected: Errors in `calculate.ts` (missing `rentenPrognose` in returned `PersonResult`). This is expected and will be fixed in Task 3.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add RentenPrognose types and jahreBisRente to Person"
```

---

### Task 2: Implement Rente Calculation (TDD)

**Files:**
- Create: `src/logic/rente.ts`
- Create: `src/logic/__tests__/rente.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/logic/__tests__/rente.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { berechneRentenPrognose } from '../rente';

describe('berechneRentenPrognose', () => {
  it('returns null when jahreBisRente is null', () => {
    expect(berechneRentenPrognose(65000, null)).toBeNull();
  });

  it('returns null when jahreBisRente is 0', () => {
    expect(berechneRentenPrognose(65000, 0)).toBeNull();
  });

  it('calculates correctly for 65k brutto, 20 years', () => {
    const result = berechneRentenPrognose(65000, 20);
    // Rentenpunkte/Jahr = 65000 / 50493 = 1.28731...
    // Gesamt = 1.28731 * 20 = 25.7463...
    // Monatsrente = 25.7463 * 39.32 = 1012.35...
    expect(result).not.toBeNull();
    expect(result!.rentenpunkte).toBeCloseTo(25.75, 1);
    expect(result!.monatlicherente).toBeCloseTo(1012.35, 0);
  });

  it('caps at BBG_RV (96600) for high earners', () => {
    const result = berechneRentenPrognose(150000, 10);
    const resultAtBBG = berechneRentenPrognose(96600, 10);
    // Above BBG should yield same result as exactly at BBG
    expect(result!.rentenpunkte).toBeCloseTo(resultAtBBG!.rentenpunkte, 2);
    expect(result!.monatlicherente).toBeCloseTo(resultAtBBG!.monatlicherente, 2);
  });

  it('calculates correctly for 1 year', () => {
    const result = berechneRentenPrognose(50493, 1);
    // Exactly average income = 1 Rentenpunkt/year
    expect(result!.rentenpunkte).toBeCloseTo(1.0, 2);
    expect(result!.monatlicherente).toBeCloseTo(39.32, 2);
  });

  it('returns null for negative jahreBisRente', () => {
    expect(berechneRentenPrognose(65000, -5)).toBeNull();
  });

  it('returns zero values for zero brutto', () => {
    const result = berechneRentenPrognose(0, 10);
    expect(result!.rentenpunkte).toBe(0);
    expect(result!.monatlicherente).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/logic/__tests__/rente.test.ts`
Expected: FAIL — module `../rente` not found.

- [ ] **Step 3: Implement `berechneRentenPrognose`**

Create `src/logic/rente.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/logic/__tests__/rente.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/rente.ts src/logic/__tests__/rente.test.ts
git commit -m "feat: add Rentenprognose calculation with tests"
```

---

### Task 3: Wire Rente into `berechneNetto`

**Files:**
- Modify: `src/logic/calculate.ts`

- [ ] **Step 1: Import and call `berechneRentenPrognose` in `berechnePersonErgebnis`**

In `src/logic/calculate.ts`, add the import at the top:

```typescript
import { berechneRentenPrognose } from './rente';
```

In `berechnePersonErgebnis`, add `rentenPrognose` to both return statements.

In the early-return (zero brutto, line 17-30), add `rentenPrognose: null` to the returned object:

```typescript
      rentenPrognose: null,
```

At the end of the function (before the final return, around line 71), compute the prognose:

```typescript
  const rentenPrognose = berechneRentenPrognose(brutto, person.jahreBisRente);
```

Add `rentenPrognose` to the returned object (after `pauschalen`):

```typescript
    rentenPrognose,
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Run all existing tests to ensure nothing breaks**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/logic/calculate.ts
git commit -m "feat: wire Rentenprognose into berechneNetto"
```

---

### Task 4: Add Input Field

**Files:**
- Modify: `src/components/InputPanel.tsx`

- [ ] **Step 1: Add "Jahre bis zur Rente" field to `PersonInputs`**

In `src/components/InputPanel.tsx`, inside the `PersonInputs` component, add a new label after the Fahrtstrecke label (after line 37, before the closing `</div>`):

```tsx
        <label className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Jahre bis zur Rente</span>
          <input
            type="number"
            min="0"
            className="w-32 text-right text-sm border border-gray-300 rounded px-2 py-1 bg-gray-50"
            value={person.jahreBisRente ?? ''}
            onChange={(e) =>
              onChange({
                ...person,
                jahreBisRente: e.target.value === '' ? null : Number(e.target.value) || 0,
              })
            }
          />
        </label>
```

- [ ] **Step 2: Verify in browser**

Run: `npx vite dev` (if not already running)
Expected: "Jahre bis zur Rente" field appears under Fahrtstrecke for Hauptverdiener, and for Ehepartner when enabled. Field is empty by default. Typing a number sets it; clearing it returns to empty.

- [ ] **Step 3: Commit**

```bash
git add src/components/InputPanel.tsx
git commit -m "feat: add Jahre bis zur Rente input field per person"
```

---

### Task 5: Add Result Summary Card

**Files:**
- Modify: `src/components/ResultPanel.tsx`

- [ ] **Step 1: Add conditional Rentenprognose cards after existing summary cards**

In `src/components/ResultPanel.tsx`, add the Renten cards after the existing summary `<div className="flex gap-3 mb-4">` block (after line 39, before the `<NettoChart>` line):

```tsx
      {/* Rentenprognose cards */}
      {(result.person1.rentenPrognose || result.person2?.rentenPrognose) && (
        <div className="flex gap-3 mb-4">
          {result.person1.rentenPrognose && (
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-gray-500 uppercase">
                {scenario.hasPartner ? 'Zusätzl. Rente (Person 1)' : 'Zusätzl. Rente/Monat'}
              </div>
              <div className="text-xl font-bold text-green-600 mt-1">
                {formatEur(result.person1.rentenPrognose.monatlicherente)}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {result.person1.rentenPrognose.rentenpunkte.toFixed(2)} Rentenpunkte
              </div>
            </div>
          )}
          {result.person2?.rentenPrognose && (
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-gray-500 uppercase">Zusätzl. Rente (Person 2)</div>
              <div className="text-xl font-bold text-green-600 mt-1">
                {formatEur(result.person2.rentenPrognose.monatlicherente)}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {result.person2.rentenPrognose.rentenpunkte.toFixed(2)} Rentenpunkte
              </div>
            </div>
          )}
        </div>
      )}
```

- [ ] **Step 2: Verify in browser**

Expected:
- No Renten cards visible when "Jahre bis zur Rente" is empty for both persons.
- Enter 20 for Hauptverdiener with 65k brutto → card appears showing ~1.012 EUR and ~25.75 Rentenpunkte.
- Enable Ehepartner, enter different years → second card appears independently.
- Clear the field → card disappears.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ResultPanel.tsx
git commit -m "feat: add Rentenprognose summary cards to ResultPanel"
```
