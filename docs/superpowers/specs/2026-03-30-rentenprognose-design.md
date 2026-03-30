# Rentenprognose — Design Spec

## Zusammenfassung

Berechnung der zusaetzlichen Rente, die man in den naechsten X Jahren bis zur Rente "verdient". X ist pro Person optional — wenn nicht angegeben, wird keine Rentenprognose berechnet. Die Berechnung basiert auf dem Rentenpunktesystem mit den Werten von 2025.

## Berechnung

### Formel

```
Rentenpunkte/Jahr = min(bruttoJahr, BBG_RV) / DURCHSCHNITTSENTGELT_2025
Gesamt-Rentenpunkte = Rentenpunkte/Jahr * jahreBisRente
Monatliche Rente = Gesamt-Rentenpunkte * AKTUELLER_RENTENWERT
```

### Konstanten (2025)

| Konstante | Wert | Beschreibung |
|-----------|------|--------------|
| DURCHSCHNITTSENTGELT_2025 | 50.493 EUR | Vorlaeufiges Durchschnittsentgelt |
| AKTUELLER_RENTENWERT | 39,32 EUR | Rentenwert pro Punkt pro Monat |
| BBG_RV | 96.600 EUR | Beitragsbemessungsgrenze Rentenversicherung (existiert bereits in `social.ts`) |

### Regeln

- Einkommen ueber der BBG_RV bringt keine zusaetzlichen Rentenpunkte (analog zur Beitragsberechnung).
- `jahreBisRente` ist pro Person individuell und optional.
- Wenn `jahreBisRente` null ist, wird keine Prognose berechnet (Ergebnis: null).

## Typen-Aenderungen

### Person (erweitert)

```typescript
interface Person {
  bruttoJahr: number;
  fahrtstreckeKm: number;
  jahreBisRente: number | null;  // NEU — optional
}
```

### RentenPrognose (neu)

```typescript
interface RentenPrognose {
  rentenpunkte: number;
  monatlicherente: number;
}
```

### PersonResult (erweitert)

```typescript
interface PersonResult {
  // ... bestehende Felder ...
  rentenPrognose: RentenPrognose | null;  // NEU
}
```

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/types/index.ts` | `jahreBisRente` in Person, `RentenPrognose` Typ, `rentenPrognose` in PersonResult |
| `src/logic/rente.ts` | **Neu** — `berechneRentenPrognose(bruttoJahr, jahreBisRente)` |
| `src/logic/calculate.ts` | Aufruf der Rentenberechnung pro Person in `berechneNetto()` |
| `src/components/InputPanel.tsx` | Optionales Feld "Jahre bis zur Rente" pro Person |
| `src/components/ResultPanel.tsx` | Bedingte Summary-Card(s) fuer Rentenprognose |
| `src/store/scenarioStore.ts` | Default `jahreBisRente: null` in Person-Defaults |
| `src/logic/__tests__/rente.test.ts` | **Neu** — Unit-Tests fuer Rentenberechnung |

## UI

### Input

- Neues optionales Zahlenfeld "Jahre bis zur Rente" pro Person im InputPanel.
- Platziert unter dem Fahrtstrecke-Feld.
- Wenn leer: wird als `null` behandelt.

### Output

- Neue Summary-Card(s) im ResultPanel, nur sichtbar wenn `rentenPrognose !== null`.
- Pro Person eine Card mit: monatlicher Rente in EUR und Anzahl Rentenpunkte.
- Kein Eintrag in CalculationDetails.

## Beispielrechnung

Person mit 65.000 EUR Brutto, 20 Jahre bis zur Rente:

```
Rentenpunkte/Jahr = min(65000, 96600) / 50493 = 1,2873
Gesamt-Rentenpunkte = 1,2873 * 20 = 25,746
Monatliche Rente = 25,746 * 39,32 = 1.012,34 EUR
```
