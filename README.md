# Lotti & Greta Kart

Ein Funrennen im Stil von Mario Kart – mit den Figuren und der Welt aus **Lotti & Greta**
([LottiGretaWorld](https://github.com/Alex1977-code/LottiGretaWorld)). Läuft im Browser (PC und Handy im
Querformat), installierbar als PWA. Alle Grafiken und Töne entstehen per Code – keine externen Assets.

## Fahrerinnen und Fahrer

| Figur | Stärke |
| --- | --- |
| **Lotti** (Zöpfe, rote Schleife, blaues Kleid) | flink in den Kurven |
| **Greta** (langes Haar, Haarreif, grünes Kleid) | schnell auf der Geraden |
| **Pflaume** (schwarzes Schlappohr-Kaninchen) | federleicht, beschleunigt sofort |
| **Pilzling** | klein, wendig, gut im Gelände |
| **Panzerkröte** | ausgewogen |
| **Zauberkröte** | beste Lenkung |
| **Rammbock-Bulle** | schwer, schiebt alle weg |
| **Baron Brummbär** im roten Roadster | der Schwerste und Schnellste |

Die Figuren sind die Original-3D-Modelle aus LottiGretaWorld (`src/lgw/`, unverändert übernommen bis auf eine
neue Sitzpose `kart` für die Heldinnen in `src/lgw/three/avatars/hero.js`).

## Strecken und Cups

| Strecke | Thema | Besonderheit |
| --- | --- | --- |
| Kraxelwiesen-Ring | Wiese der Grünen Blockinsel | Pilzlinge watscheln über die Fahrbahn, Schanze |
| Herbstwald-Runde | Laubwald | Krabbelkäfer, Hummel, zwei Schanzen |
| Laternengrotte | Höhle | Stampfsteine krachen von der Decke |
| Kippfeld-Manege | Zirkuszelt | Panzerkröten, stürmender Rammbock-Bulle, Trampoline |
| Brummbärs Abendautobahn | Autobahn im Abendrot | Bombenkanonen schießen Kickbomben (roter Ring = Einschlag) |

**Beeren-Cup** (4 Rennen) und **Brummbär-Cup** (alle 5 Strecken). Punkte 15-12-10-8-6-4-2-1, am Ende
Siegerehrung mit Pokal. Dazu **Einzelrennen** und **Zeitfahren** (mit drei Turbo-Beeren, Bestzeiten werden
gespeichert). Klassen: Gemütlich (50 ccm), Flott (100 ccm), Rasant (150 ccm).

## Gegenstände (aus den Funkel-Kisten)

Turbo-Beere (×1 oder ×3) · Panzer (prallt von Banden ab) · Goldpanzer (sucht sich die Fahrerin davor) ·
Krabbelkäfer (hinten ablegen) · Kickbombe (nach vorn werfen, explodiert) · Funkenblüte (3 Funkenbälle) ·
Funkelstern (unverwundbar, schneller) · Riesentrank (riesengroß, plättet andere) · Zauberkugel (trifft die Spitze).
Wer vorn liegt, bekommt eher Verteidigung, wer hinten liegt, eher starke Gegenstände.

**Bitcoins** auf der Strecke machen das Kart schneller (bis 10). **Driften** in Kurven lädt einen Mini-Turbo
(blau → orange → pink). **Schanzen**: in der Luft Drift drücken = Trick mit Turbo bei der Landung.
**Startturbo**: Gas genau bei der „2“ drücken.

## Steuerung

| | Tastatur | Gamepad | Handy (quer) |
| --- | --- | --- | --- |
| Lenken | ← → / A D | linker Stick | Daumen links nach links/rechts ziehen |
| Gas | ↑ / W | A | automatisch (in den Einstellungen abschaltbar) |
| Bremse / rückwärts | ↓ / S | B | Knopf **BREMSE** |
| Hüpfer & Driften | Leertaste / Shift | R | Knopf **DRIFT** halten |
| Gegenstand | X / E / Strg | L | Knopf **★** |
| Pause | Esc / P | Start | – (pausiert automatisch, wenn die App in den Hintergrund geht) |
| Ton | M | | Knopf im Menü |

## Entwicklung

```bash
npm install
npm run dev        # Dev-Server (http://localhost:5173)
npm run build      # Produktions-Build nach dist/
npm test           # Build + Headless-Renntest auf allen Strecken (Chromium), Screenshots → tests/out/
node tools/check-tracks.mjs   # Streckengeometrie prüfen (Banden dürfen sich nicht schneiden)
```

URL-Parameter für Tests: `?race=<strecke>&racer=<id>&cc=50|100|150&laps=n`, `?demo=1` (nur Computer),
`?quality=0|1|2`.

### Aufbau

```
src/
  main.js             Renderer, Hauptschleife, Rennen starten/beenden
  game/               Race (Ablauf, Kamera, Wertung), Racer (Kart-Physik, Drift, Treffer), ai.js (Computer-Fahrer),
                      items.js (Kisten, Bitcoins, Geschosse), hazards.js (Gegner auf der Strecke), drivers.js
                      (Figuren im Kart), kartModel.js, effects.js (Partikel), audio.js (Motor, Musik), Ceremony.js
  world/              Track (Mittellinie, Fahrbahn, Gelände, Banden), Sky, decor.js (Kulisse), themes.js
  tracks/             Streckendefinitionen (Kontrollpunkte, Kisten, Turbo-Felder, Schanzen, Gefahren, Kulisse)
  ui/                 Menüs, HUD mit Minikarte, Touch-Steuerung, Eingabe, Symbole aus den 3D-Modellen
  lgw/                übernommene Module aus LottiGretaWorld (Figuren, Modelle, Musik und Effekte)
```

Eine neue Strecke ist eine Datei in `src/tracks/` (geschlossener Kurs aus Kontrollpunkten `[x, z, halbe Breite]`)
plus ein Eintrag in `src/tracks/index.js`.

## Veröffentlichen

`.github/workflows/deploy.yml` baut bei jedem Push auf `main`/`master` und veröffentlicht auf GitHub Pages
(einmalig: Settings → Pages → Source „GitHub Actions“).
