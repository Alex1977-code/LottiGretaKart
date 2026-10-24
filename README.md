# Lotti & Greta Kart

Ein Funrennen im Stil von Mario Kart – mit den Figuren und der Welt aus **Lotti & Greta**
([LottiGretaWorld](https://github.com/Alex1977-code/LottiGretaWorld)). Läuft im Browser (PC und Handy im
Querformat), installierbar als PWA. Alle Grafiken und Töne entstehen per Code – keine externen Assets.

**Spielen (immer die neueste Version):** https://alex1977-code.github.io/LottiGretaKart/ (GitHub Pages) ·
https://claude.ai/artifact/1vGX9FKhPnW2eDyYtmeHSJ

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
| **Krallen-Pilzling**, **Kickbombe**, **Wühler**, **Waldkobold** | neu für die 12er-Felder |
| **Baron Brummbär** im roten Roadster | der Schwerste und Schnellste |

Die Figuren sind die Original-3D-Modelle aus LottiGretaWorld (`src/lgw/`, unverändert übernommen bis auf eine
neue Sitzpose `kart` für die Heldinnen in `src/lgw/three/avatars/hero.js`).

## Die Insel (wie in Mario Kart World)

Alle vierzehn Strecken liegen auf **einer zusammenhängenden Insel** – der Grünen Blockinsel – und sind durch Landstraßen
verbunden. Man kann von Strecke zu Strecke fahren, über den See (auf dem Wasser), durch den Höhlenberg und ins
Zirkuszelt. Himmel, Licht und Nebel blenden beim Fahren je Region über (Sonne über der Wiese, goldener Herbst,
dunkle Höhle, Zirkus-Scheinwerfer, Abendrot über der Stadt, Strand, Schnee, Burg im Mondlicht).

| Strecke | Region | Besonderheit |
| --- | --- | --- |
| Kraxelwiesen-Ring | Wiese in der Inselmitte | Pilzlinge watscheln über die Fahrbahn, Schanze |
| Herbstwald-Runde | Laubwald im Norden | Krabbelkäfer, Hummel, zwei Schanzen |
| Laternengrotte | im Höhlenberg im Westen | Stampfsteine krachen von der Decke |
| Kippfeld-Manege | im Zirkuszelt im Südwesten | Panzerkröten, stürmender Rammbock-Bulle, Trampoline |
| Brummbärs Abendautobahn | Stadt im Osten | Bombenkanonen schießen Kickbomben (roter Ring = Einschlag) |
| Funkelstrand | Südküste | Palmen, Sonnenschirme, Lagune, Strandkrabben, Schnappblumen, zwei Dünen-Schanzen |
| Glitzergipfel | verschneites Hochplateau im Nordosten | Serpentinen, Bohnenranken, Riesenschneebälle rollen über die Bahn |
| Brummbär-Burg | Festung auf der Nordklippe, im Mondlicht | Burgmauern und Türme, Bombenkanonen, Pilzlingsturm, Rammbock-Bulle, Schnappblumen |
| Sonnenschlucht | Wüste im fernen Osten | Tafelberge, Kakteen, Oase, Steppenläufer rollen über die Bahn, Skorpion-Käfer |
| Feuerberg | Vulkan im Südwesten | Lava-Seen (hineinfahren = zurückgesetzt), Feuer-Geysire (roter Ring = Warnung), Stampfsteine |
| Zuckerwatten-Allee | Bonbonland im Nordwesten | Schokoladen-Fahrbahn, Zuckerstangen, Lutscher, Donuts, rollende Kaugummikugeln |
| Loro Parque | Tierpark an der Ostküste | Thai-Tor, Papageien-Volieren, Flamingos, Gorillas, Tiger, Planet Penguin (Pinguine watscheln über die Straße), gläserner Hai-Tunnel, Delfin-Lagune, Seelöwen – und die **Orca-Show**: der Wal springt und spritzt eine Welle über die Fahrbahn (blauer Ring = gleich! nass = langsamer, „PLATSCH!“) |
| Piratenbucht | Südküste | **Eine Acht**: in der Mitte unten durch, später oben über die Holzbrücke. Piratenschiff in der Lagune, Piratenkanonen schießen Kanonenkugeln (roter Ring = Einschlag), rollende Pulverfässer, Krabben, Schatzinsel mit Totenkopf-Felsen, Leuchtturm |
| Dino-Dschungel | Nordküste | **Schleife mit Looping**: großer Bogen, enge innere Schleife ums Dino-Nest, zurück über die Lianenbrücke genau über die eigene Strecke. T-Rex stapft über die Fahrbahn (platt!), Flugsaurier, Triceratops-Herde, rollende Felsbrocken, Brachiosaurier, Wasserfall |

**Modi**
- **Grand Prix** (Beeren-, Brummbär-, Muschel-, Kronen-, Bonbon-, Wüsten-, Tierpark-, Piraten- und Dino-Cup): das erste Rennen sind Runden, ab dem zweiten startet man an der
  vorigen Strecke und fährt über die Verbindungsstraße zur nächsten (Anfahrt + Runden). Punkte für 12 Fahrer,
  am Ende Siegerehrung mit Pokal.
- **K.-o.-Tour** (Große Inseltour, Kleine Runde, Küste und Gipfel, Wilde Weltreise, Tierpark-Safari, Schatzsuche): eine Rallye quer über die Insel mit 12 Fahrern; an jedem
  Checkpoint scheiden die Letzten aus.
- **Einzelrennen** und **Zeitfahren** (mit drei Turbo-Beeren, Bestzeiten werden gespeichert).
- **Freie Fahrt**: die ganze Insel erkunden und 48 versteckte Sternmünzen finden (werden gespeichert).

- **Mehrere Handys** (bis zu 12 Fahrer, Rest Computer): ein Handy ist Gastgeber und rechnet das Rennen, jeder Gast
  fährt sein eigenes Kart direkt (keine Eingabeverzögerung) und sieht die anderen nach Schnappschüssen des Gastgebers.
  - **Übers Internet, beliebig weit weg**: Gastgeber bekommt einen vierstelligen Raumcode (auch als QR-Code/Link
    `?join=CODE`), Gäste geben ihn unter „Beitreten“ ein (Vermittlung über den öffentlichen PeerJS-Server, danach
    direkte WebRTC-Verbindung).
  - **In der Nähe, ganz ohne Netz** (Flugzeug): in der **iPhone-App** finden sich die Handys direkt per Bluetooth/WLAN
    (Apple MultipeerConnectivity) – Flugmodus an, WLAN und Bluetooth wieder einschalten, Spiel in der Liste antippen.
    Bauen und installieren: [ios/README.md](ios/README.md).
  - **Ohne Internet im Browser**: alle Handys im selben WLAN; der Gastgeber zeigt einen QR-Code, der Gast scannt ihn
    und zeigt seinen Antwort-Code, den der Gastgeber scannt – kein Server nötig. Achtung: das iPhone kann im
    Flugmodus keinen Hotspot öffnen (viele Android-Handys schon).
- **Mehrspieler** für 2–4 Spieler im geteilten Bildschirm (zwei Spieler oben/unten, drei oder vier in vier Feldern):
  Beitreten in der Lobby mit A am Controller, Leertaste (Tastatur links) oder Enter (Tastatur rechts); jeder wählt
  seine Figur. Grand Prix, Rennen, K.-o.-Tour und Freie Fahrt gehen zusammen. Läuft komplett auf einem Gerät –
  ohne Internet, also auch im Flugzeug.

Klassen: Gemütlich (50 ccm), Flott (100 ccm), Rasant (150 ccm).

**Karte**: Die Nahkarte dreht mit (vorn ist oben), der Weg voraus ist gelb mit Pfeilen; Antippen/Klicken wechselt
zur ganzen Insel. Kommt eine Kurve oder ist man abseits, zeigt ein gelber Pfeil „Hier entlang“.

**Ton am iPhone**: wie gewohnt – Stummschalter auf lautlos = kein Ton, auf laut = Ton (Freischaltung beim ersten Antippen).

**Offline / Flugzeug**: Beim ersten Besuch speichert der Service Worker das ganze Spiel (inklusive Schriften); danach
läuft es ohne Netz. Auf dem Handy am besten „Zum Home-Bildschirm“ hinzufügen.

**Auf den Fernseher**: iPhone/iPad per AirPlay-Bildschirmsynchronisierung, Android per „Bildschirm übertragen“, Laptop
per HDMI oder Chrome „Streamen“, oder den Link direkt im Browser von Smart-TV/Fire TV öffnen. Im Spiel: „📺 Auf den TV“.

**Fahrtechniken**: Driften mit Mini-Turbo (das Kart stellt sich dabei deutlich quer), Startturbo, Trick-Turbo auf Schanzen, **Aufladesprung** (Drift-Taste
geradeaus halten und loslassen), **Grind-Schienen** (draufspringen und entlanggleiten – eine führt quer über den
See), **auf dem Wasser fahren**.

## Gegenstände (aus den Funkel-Kisten)

Turbo-Beere (×1 oder ×3) · Panzer (prallt von Banden ab) · Goldpanzer (sucht sich die Fahrerin davor) ·
Krabbelkäfer (hinten ablegen) · Kickbombe (nach vorn werfen, explodiert) · Funkenblüte (3 Funkenbälle) ·
Funkelstern (unverwundbar, schneller) · Riesentrank (riesengroß, plättet andere) · Zauberkugel (trifft die Spitze).
Wer vorn liegt, bekommt eher Verteidigung, wer hinten liegt, eher starke Gegenstände.

**Bitcoins** auf der Strecke machen das Kart schneller (bis 10). **Driften** in Kurven lädt einen Mini-Turbo
(blau → orange → pink). **Schanzen**: in der Luft Drift drücken = Trick mit Turbo bei der Landung.
**Start**: Erst stellt sich die Strecke vor, dann hängt oben eine Ampel – bei 3, 2, 1 geht je eine rote Lampe an, bei LOS leuchten alle grün. **Startturbo**: Gas genau bei der „2“ drücken (am Handy zählt nur der Gas-Knopf, nicht das Lenkrad).

## Steuerung

| | Tastatur | Controller (Xbox, PlayStation, Switch) | Handy (quer) |
| --- | --- | --- | --- |
| Lenken | ← → / A D | linker Stick | Daumen links nach links/rechts ziehen |
| Gas | ↑ / W | A oder RT | Knopf **GAS** halten (Automatik in den Einstellungen) |
| Bremse / rückwärts | ↓ / S | B | Knopf **BREMSE/ZURÜCK** halten |
| Hüpfer & Driften | Leertaste / Shift (geradeaus halten = Aufladesprung) | R | **GAS pumpen** (Gas – los – Gas – los …), aufhören = Mini-Turbo (Automatik-Gas: Knopf **DRIFT**) |
| Gegenstand | X / E / Strg | L / LT | Knopf **★** |
| Pause | Esc / P | Start | – (pausiert automatisch, wenn die App in den Hintergrund geht) |
| Ton | M | | Knopf im Menü |

Im Mehrspieler teilen sich zwei Spieler die Tastatur: links WASD + Leertaste (Driften) + Q (Gegenstand), rechts
Pfeiltasten + Shift rechts/L (Driften) + Enter/K (Gegenstand).

## Entwicklung

```bash
npm install
npm run dev        # Dev-Server (http://localhost:5173)
npm run build      # Produktions-Build nach dist/
npm test           # Build + Headless-Renntest auf allen Strecken (Chromium), Screenshots → tests/out/
node tools/check-tracks.mjs   # Streckengeometrie prüfen (Banden dürfen sich nicht schneiden)
```

URL-Parameter für Tests: `?race=<strecke>&racer=<id>&cc=50|100|150&laps=n`, `?mode=gp&from=<strecke>` (mit Anfahrt),
`?mode=ko&tour=insel|kurz|kueste`, `?mode=free`, `?quality=1|2|3`, Mehrspieler `?players=lotti:kb1,greta:pad0`. `node tools/draw-world.mjs` zeichnet die Inselkarte.

### Aufbau

```
src/
  main.js             Renderer, Hauptschleife, Rennen starten/beenden
  game/               Race (Ablauf, Kamera, Wertung), Racer (Kart-Physik, Drift, Treffer), ai.js (Computer-Fahrer),
                      items.js (Kisten, Bitcoins, Geschosse), hazards.js (Gegner auf der Strecke), drivers.js
                      (Figuren im Kart), kartModel.js, effects.js (Partikel), audio.js (Motor, Musik), Ceremony.js
  world/              worldDef.js (Inselplan: Strecken, Verbindungsstraßen, See, Berge, Regionen, Schienen),
                      World (Höhenfeld, Oberflächen, Kollisionen), WorldView (Darstellung), Track, Sky, decor.js
  game/RacePath.js    Rennpfad durch die Welt (Runden, Anfahrt, Rallye)
  tracks/             Streckendefinitionen (Kontrollpunkte, Kisten, Turbo-Felder, Schanzen, Gefahren, Kulisse)
  ui/                 Menüs, HUD mit Minikarte, Touch-Steuerung, Eingabe, Symbole aus den 3D-Modellen
  lgw/                übernommene Module aus LottiGretaWorld (Figuren, Modelle, Musik und Effekte)
```

Eine neue Strecke ist eine Datei in `src/tracks/` (geschlossener Kurs aus Kontrollpunkten `[x, z, halbe Breite]`),
ein Platz auf der Insel und mindestens eine Verbindungsstraße in `src/world/worldDef.js`.

## Veröffentlichen

`.github/workflows/deploy.yml` baut bei jedem Push auf den Standard-Branch (bzw. `main`/`master`) und veröffentlicht auf
GitHub Pages unter https://alex1977-code.github.io/LottiGretaKart/ (einmalig: Settings → Pages → Source „GitHub Actions“).
