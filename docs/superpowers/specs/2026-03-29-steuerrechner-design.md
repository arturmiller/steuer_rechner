# Steuerrechner SPA — Design Spec

## Überblick

React Single Page Application zur Berechnung des Nettogehalts aus dem Bruttogehalt nach deutschem Steuerrecht 2025. Steuerklasse IV, Ehegattensplitting, Sozialabgaben, Pauschalen. Mehrere Szenarien als Tabs, Speichern/Laden als JSON-Datei.

## Tech Stack

- **Vite** — Build-Tool
- **React + TypeScript** — UI
- **Zustand** — State Management (Szenarien)
- **Recharts** — Netto/Brutto-Diagramm
- **Tailwind CSS** — Styling
- Kein Backend, reine Client-App

## Steuerrecht 2025

### Steuerklasse

Ausschließlich Steuerklasse IV.

### Sozialabgaben (Arbeitnehmeranteil)

| Abgabe | Satz | BBG West 2025 |
|---|---|---|
| Krankenversicherung | 7,3% + ~0,85% Zusatzbeitrag | 66.150 EUR/Jahr |
| Rentenversicherung | 9,3% | 96.600 EUR/Jahr |
| Arbeitslosenversicherung | 1,3% | 96.600 EUR/Jahr |
| Pflegeversicherung | 1,7% Basissatz. Kinderlos ab 23 Jahre: +0,6%. Mit Kindern: -0,25% pro Kind ab dem 2. Kind (max. Abschlag 1,0% bei 5+ Kindern), nur für Eltern unter 25 Jahre pro Kind. | 66.150 EUR/Jahr |

### Pauschalen

- **Arbeitnehmer-Pauschbetrag:** 1.230 EUR/Jahr
- **Entfernungspauschale:** 0,30 EUR/km (erste 20 km) + 0,38 EUR/km (ab 21 km), 230 Arbeitstage/Jahr
- **Sonderausgaben-Pauschbetrag:** 36 EUR/Jahr
- **Vorsorgepauschale:** Sozialversicherungsbeiträge als Abzug vom zu versteuernden Einkommen

### Lohnsteuer

- Zu versteuerndes Einkommen (zvE) = Brutto + Vermietungseinkünfte - Pauschalen - Vorsorgepauschale
- Einkommensteuer-Tarif 2025 nach EStG §32a (Progressionszonen mit offiziellen Formeln)
- **Ehegattensplitting:** gemeinsames zvE halbieren, Steuer auf Hälfte berechnen, verdoppeln

### Kirchensteuer

Toggle ja/nein, fester Satz 9% der Lohnsteuer.

### Solidaritätszuschlag

5,5% der Lohnsteuer, Freigrenze 18.130 EUR Lohnsteuer/Jahr.

## Eingaben

### Pro Person (Hauptverdiener + optional Ehepartner)

- Bruttojahresgehalt (EUR)
- Fahrtstrecke einfach (km)

### Gemeinsam

- Anzahl Kinder
- Einkünfte aus Vermietung/Verpachtung (EUR/Jahr, kann negativ sein)
- Kirchensteuer (Toggle ja/nein, Satz fest 9%)
- Ehepartner vorhanden (Toggle)

## Ausgaben

### Zusammenfassung (Kacheln oben)

- Brutto (Haushalt)
- Netto (Haushalt)
- Abgabenlast (%)

### Netto/Brutto-Kurve (Recharts)

- X-Achse: Brutto 0–100k EUR (Single) bzw. 0–200k EUR (Verheiratet)
- Y-Achse: Netto in EUR
- Referenzlinie Brutto=Netto (gestrichelt)
- Markierung der aktuellen Position
- Legende
- Datenpunkte: Berechnung in 1.000 EUR-Schritten über die gesamte Spanne

### Berechnungsdetails (Tabelle)

Monatliche Aufschlüsselung:
- Bruttolohn
- Lohnsteuer
- Solidaritätszuschlag
- Kirchensteuer
- Krankenversicherung
- Rentenversicherung
- Arbeitslosenversicherung
- Pflegeversicherung
- **= Nettolohn**
- Angewandte Pauschalen (als Hinweis unter der Tabelle)

Bei Ehepaar: Tabelle für jede Person separat + Haushaltssumme.

## UI-Layout

### Heller Modus

Weißer/hellgrauer Hintergrund, Akzentfarbe Blau (#2563eb), Abzüge in Rot, Netto in Grün. Deutsche Oberfläche.

### Aufbau

- **Header:** App-Titel "Steuerrechner 2025", Laden/Speichern-Buttons
- **Tab-Leiste:** Szenarien als Tabs, Doppelklick zum Umbenennen, + Button für neues Szenario
- **Links (40%):** Eingabeformular in Abschnitten (Hauptverdiener, Gemeinsam, Ehepartner)
- **Rechts (60%):** Ergebnisse (Zusammenfassung-Kacheln, Chart, Detail-Tabelle)

## Szenarien

- Mehrere unabhängige Szenarien als Tabs
- Jedes Szenario hat einen benutzerdefinierten Namen (Doppelklick auf Tab)
- Neues Szenario über + Button
- Szenarien löschbar (außer letztes)

## Speichern/Laden

- **Export:** Alle Szenarien als JSON-Datei herunterladen
- **Import:** JSON-Datei hochladen, ersetzt aktuelle Szenarien
- Kein LocalStorage, kein Backend

## Datenmodell

```typescript
interface Person {
  bruttoJahr: number;
  fahrtstreckeKm: number;
}

interface Scenario {
  id: string;
  name: string;
  person1: Person;
  hasPartner: boolean;
  person2: Person;
  kinder: number;
  vermietungEinkuenfte: number;
  kirchensteuer: boolean;
}

interface Result {
  person1: PersonResult;
  person2?: PersonResult;
  haushaltBrutto: number;
  haushaltNetto: number;
  abgabenlastProzent: number;
}

interface PersonResult {
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
  pauschalen: {
    werbungskosten: number;
    entfernungspauschale: number;
    sonderausgaben: number;
    vorsorge: number;
  };
}
```

## Projektstruktur

```
src/
  components/
    Header.tsx
    TabBar.tsx
    InputPanel.tsx
    ResultPanel.tsx
    NettoChart.tsx
    CalculationDetails.tsx
  logic/
    tax.ts            — Einkommensteuer-Tarif 2025, Splitting
    social.ts         — Sozialversicherungsbeiträge + BBGs
    deductions.ts     — Pauschalen
    calculate.ts      — berechneNetto(scenario) → Result
  store/
    scenarioStore.ts  — Zustand: Szenarien CRUD, aktiver Tab
  types/
    index.ts          — Interfaces
  utils/
    fileIO.ts         — JSON Export/Import
  App.tsx
  main.tsx
```

## Berechnungslogik

Rein funktional in `logic/`, keine React-Abhängigkeiten. Hauptfunktion `berechneNetto(scenario: Scenario): Result` gibt alle Zwischenwerte zurück. Ergebnisse werden nicht im Store gespeichert, sondern live aus dem Szenario abgeleitet (derived state).
