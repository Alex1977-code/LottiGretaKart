# Fahrplan: Strecken nach den Archetypen von Mario Kart 8 Deluxe

Grundlage ist die Strecken-Referenz (alle 96 Strecken als Steckbrief). Übernommen werden Themen, Strukturen und
Mechaniken – **keine** Nintendo-Namen, -Figuren oder 1:1-Nachbauten. Die neuen Strecken **ersetzen nach und nach
die bisherigen**; nach jeder Etappe wird hochgeladen und kann getestet werden.

Jede Strecke bekommt nach der Referenz: Umgebung, feste Tageszeit und festes Wetter (`time`, `weather`), eine
dominante Farbpalette, eine Streckenführung mit Höhenprofil und eine Signature-Mechanik. Cup-Dramaturgie: Strecke 1
leicht und hell, Strecke 2–3 je eine neue Mechanik, Strecke 4 dunkler und gefährlicher (wenig Leitplanken).

## Etappe 1 – Mechaniken (fertig)

| Mechanik | Umsetzung |
| --- | --- |
| Anti-Gravitation | `antigrav: [[von, bis, Grad]]`: Fahrbahn neigt sich in Kurven zur Steilkurve, blau leuchtende Kanten, Räder klappen waagerecht, blaues Leuchten unter dem Kart; Zusammenstöße geben beiden einen **Spin-Boost** |
| Spin-Pfosten | Gefahr `spinpost`: blau-weiße Säule auf der Fahrbahn, in der Anti-Gravitation Spin-Boost |
| Gleiter, Kuppen, Buckel | `glides`, `flights`, `heights`, `bumps` (schon vorher) |
| Unterwasser | negatives `lift` (schon vorher) |
| Tageszeit und Wetter | fest je Strecke (`time: 'day' / 'dusk' / 'night'`, `weather`), Abendlicht neu; Einstellung „Wie die Strecke“ |
| Eigene Landschaft | `land: { sea, island, hills, flats, lakes }` – jede neue Strecke hat ihr eigenes Gelände, unabhängig vom alten Inselplan |

## Etappen 2 ff. – neue Cups

Erledigt: **Etappe 2 – Sonnen-Cup** (Kart-Stadion, Seepark, Zuckerschlucht, Tempelruinen), **Etappe 3 –
Blüten-Cup** (Blumenring, Hafenstadt, Spukvilla, Wasserfall-Schlucht) und **Etappe 4 – Sternen-Cup**
(Ferienflughafen, Delfinlagune, Disco-Halle, Gipfelabfahrt mit Abschnitten, Fass-Kanone und Schneefall) und
**Etappe 5 – Kronen-Cup** (Wolkenstraße, Knochendünen, Lavafestung, Sternenbahn) und **Etappe 6 – Muschel-Cup**
(Kuhweide, Palmenstrand, Nachtautobahn, Schlossring) und **Etappe 7 – Blatt-Cup** (Buckelpisten-Arena, Eissee mit
Glatteis, Musikpark mit Klaviertasten, Felsental mit Felssäulen auf der Fahrbahn). Damit sind alle bisherigen Strecken
ersetzt; Teneriffa und Loro Parque fahren als Bonus im Kanaren-Cup (mit Hafenstadt und Palmenstrand).

Neue Technik für Etappe 5 ff.: Abschnitte ohne Leitplanken (`noWalls`, Herunterfallen = zurückgesetzt),
Regenbogen-Fahrbahn (`rainbow`), Klaviertasten mit Tönen (`piano`), Matsch, Sand und Schnee neben der Fahrbahn
(`mud`), Glatteis (`ice`), Lava neben der Strecke (`lavaAt`), feste Rundenzahl (`laps`), Tageszeit je Runde
(`timeByLap`), Jahreszeit bei jedem Start neu (`seasons`), Welt ohne Meer und Berge (`land.noWater`,
`land.backdrop: false`).

| Etappe | Cup | Strecke (eigener Name) | Archetyp / Vorbild | ersetzt |
| --- | --- | --- | --- | --- |
| 2 | Sonnen-Cup | Kart-Stadion | Stadion: Tribünen, Großbildschirme, gekippte Anti-Grav-Steilkurve, Spin-Pfosten | Kraxelwiesen-Ring |
| 2 | Sonnen-Cup | Seepark | Freizeitpark am See: Riesenrad, Karussells, Unterwasser-Abschnitt | Funkelstrand |
| 2 | Sonnen-Cup | Zuckerschlucht | Süßigkeiten-Canyon: Waffelbrücken, Anti-Grav-Wand, Puderzucker-Offroad | Zuckerwatten-Allee |
| 2 | Sonnen-Cup | Tempelruinen | Dschungeltempel: Stampfsteine, Unterwasserbecken, Wandfahrt | Dino-Dschungel |
| 3 | Blüten-Cup | Blumenring | Rennstrecke in Wiesen mit Schloss, überkreuzte Schleife, Gleiter | Herbstwald |
| 3 | Blüten-Cup | Hafenstadt | Hafenstadt mit steilen Straßen (vorhanden) | – |
| 3 | Blüten-Cup | Spukvilla | Spukvilla bei Nacht: Saal mit Anti-Grav, gefluteter Keller, Gleiter | Spukinsel |
| 3 | Blüten-Cup | Wasserfall-Schlucht | Edelsteinmine am Wasserfall (vorhanden) | – |
| 4 | Sternen-Cup | Ferienflughafen | Terminal, Rollfeld, Flugzeuge, Gepäckband | Autobahn |
| 4 | Sternen-Cup | Delfinlagune | Riff, Felsbogen, langer Unterwasserteil, Aal-Rampe | Wrack-Riff |
| 4 | Sternen-Cup | Disco-Halle | Musikclub bei Nacht, fast nur Anti-Grav, Licht im Takt | Zirkus-Manege |
| 4 | Sternen-Cup | Gipfelabfahrt | Winterberg als Sektionsstrecke ohne Runden, Slalomtore | Glitzergipfel |
| 5 | Kronen-Cup | Wolkenstraße | Wolken, Bohnenranke, Luftschiffe, Gewitter | Laternengrotte |
| 5 | Kronen-Cup | Knochendünen | Wüste mit Riesenskeletten, Oase, Treibsand | Sonnenschlucht |
| 5 | Kronen-Cup | Lavafestung | Vulkanburg, Lava ohne Leitplanken, schlagende Statue | Feuerberg, Brummbär-Burg |
| 5 | Kronen-Cup | Sternenbahn | Regenbogenbahn im All, ohne Leitplanken, Gleiter | – |
| 6 | Muschel-Cup | Kuhweide | Bauernhof-Hügel, Abendlicht, Kühe, Matschpfützen | Hasenhügel |
| 6 | Muschel-Cup | Palmenstrand | Tropenstrand, Krabben, Unterwasser-Abkürzung | Piratenbucht |
| 6 | Muschel-Cup | Nachtautobahn | Stadtautobahn bei Nacht mit Verkehr | Mitternachts-Highway |
| 6 | Muschel-Cup | Schlossring | Parklandschaft, Gleiter über den See (vorhanden) | – |
| 7 | Blatt-Cup | Buckelpisten-Arena | Motocross (vorhanden) | – |
| 7 | Blatt-Cup | Eissee | zugefrorener See, Eishöhle, rutschig | Katzeninsel |
| 7 | Blatt-Cup | Musikpark | Riesen-Instrumente, Tasten mit Tönen | Palmen-City |
| 7 | Blatt-Cup | Felsental | Felssäulen teilen die Fahrbahn in mehrere Wege, rollende Riesen-Eier | – (neu) |
| 8 | Blitz-Cup | Kirschblüteninsel | Tempel, Kirschbäume, Bambus, Anti-Grav über den Teich | Teneriffa (bleibt Bonus) |
| 8 | Blitz-Cup | Drachenmauer | lange Mauer über die Berge, Drachenkopf-Tunnel | – |
| 8 | Blitz-Cup | Neonmetropole | Zukunftsstadt bei Nacht, Anti-Grav-Röhren | – |
| 8 | Blitz-Cup | Goldmine | Bergwerk, Loren, Holzbrücken, Höhle | – |
| 9 | Ei-Cup | Babypark | kleines Oval, sieben Runden, viel Gedränge | – |
| 9 | Ei-Cup | Käseland | Käselöcher, Käse-Buckel, Mäuse | – |
| 9 | Ei-Cup | Baumwipfelweg | Holzstege in den Baumkronen, Pilzbrücken | – |
| 9 | Ei-Cup | Jahreszeitendorf | Dorf, bei jedem Start eine andere Jahreszeit | – |
| 10 | Glocken-Cup | Abendsteppe | Savanne, je Runde andere Tageszeit (Tag → Abend → Nacht) | – |
| 10 | Glocken-Cup | Badezimmer | Miniaturwelt: Karts klein im riesigen Bad | – |
| 10 | Glocken-Cup | Uhrwerk | Zahnräder, Pendel, Uhrzeiger | – |
| 10 | Glocken-Cup | Stadtrundfahrt | Großstadt mit Sehenswürdigkeiten | – |

Teneriffa und Loro Parque waren eigene Wünsche – sie bleiben vorerst als Bonus-Strecken erhalten, bis anders
gewünscht. Danach folgen Archetypen aus den Booster-Strecken (Städte mit wechselnder Route je Runde,
Tageszeitwechsel über die Runden, Miniatur-Welt).
