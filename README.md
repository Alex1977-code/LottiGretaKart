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

## Die Strecken (wie in Mario Kart 8 Deluxe)

Gefahren wird immer auf **einer Strecke in ihrer eigenen Welt**: vor dem Rennen wird sie geladen (die vorige
abgebaut). Die fünfundzwanzig Strecken haben feste Plätze in einer gemeinsamen Landschaft (Grüne Blockinsel und
Nachbarinseln, `src/world/worldDef.js`) – daraus schneidet `courseWorldDef` den Ausschnitt einer Strecke mit
Gelände, Seen, Küste, Höhlenberg bzw. Zirkuszelt. Ringsum geht die **Fernsicht** bis zum Horizont: die Landschaft
steigt hinter dem Ausschnitt zu einem Bergkranz an (Wiesen, Wälder, Fels, Schnee je nach Thema; über dem Meer
bleibt der Blick frei, nur einzelne Inseln), der Nebel setzt spät ein – am Horizont liegen die Berge im Dunst
(`src/world/backdrop.js`). Weil nur eine Strecke im Speicher ist, ist die Kulisse dicht: Wälder, Blumen und
Grasbüschel nach Fläche, mehr Ausstattung an der Strecke. Himmel, Licht und Nebel blenden je Region über (Sonne
über der Wiese, goldener Herbst, dunkle Höhle, Zirkus-Scheinwerfer, Abendrot über der Stadt, Strand, Schnee, Burg im
Mondlicht).
Das Meer bewegt sich (Wellen im Shader, türkis im Flachen, tiefblau draußen, Schaum-Säume am Strand), Wiesen und
Straßen haben aus der Nähe eine feine Struktur, Wiesen sattere und sonnige Flecken, am Meeresgrund wandern
Lichtmuster (`src/world/shaders.js`). Gras, Blumen, Schilf und Bäume wiegen sich im Wind; Farne unter Bäumen,
Gänseblümchen, Schilf an Ufern; Segelboote vor der Küste, Vogelschwärme und
Schmetterlinge um das eigene Kart (`src/world/life.js`).

| Strecke | Region | Besonderheit |
| --- | --- | --- |
| Kart-Stadion | eigene Landschaft (Archetyp Stadion) | Start-Ziel-Gerade zwischen vollen **Tribünen**, **Großbildschirme**, Ballons, Fahnen; den Hang hinauf in die große **Anti-Gravitations-Steilkurve** (blaue Kanten, schwebende Räder, **Spin-Pfosten**), über die Kuppe und die **Gleiter-Schanze** über den Teich zurück ins Stadion; sonniger Tag |
| Blumenring | eigene Landschaft (Archetyp Rennstrecke in der Wiese) | Klassische Rennstrecke zwischen Blumenwiesen, im Hintergrund das **Märchenschloss**; eine **Acht** mit **Anti-Grav-Brücke** über sich selbst, **Gleiter-Schanze** auf dem Hügel über den Teich, **Pilzlinge** laufen über die Fahrbahn; heller Tag |
| Wolkenstraße | eigene Welt hoch über den Wolken (Archetyp Himmelsstrecke) | Weiße Wolkenwege **ohne Pfeiler** über einem **Wolkenmeer**, mit dem **Gleiter** hinüber zur riesigen **Bohnenranke** (Anti-Gravitation den Hang hinauf, Spin-Pfosten), über das Deck der **Luftschiff-Werft** und durch die **Gewitterwolken** ohne Leitplanken (wer fällt, wird zurückgeholt) |
| Disco-Halle | eigene Landschaft (Archetyp Musikclub), **Nacht** | Fast komplett **Anti-Gravitation**: **Wellenbahn** über die Tanzfläche, steile Wandkurven, Treppe hinauf zur Bühne mit Turbo-Feldern, **Gleiter**; **Boxentürme pumpen im Takt**, **Scheinwerferkegel** schwenken, riesige **Discokugel**, Großbildschirme |
| Ferienflughafen | eigene Insel (Archetyp Ferienflughafen) | Vorfeld mit **Gepäckschleppern**, mitten durch das **Terminal**, **Anti-Grav-Steilkurve** um den **Kontrollturm**, breite **Startbahn** an geparkten Flugzeugen vorbei (ein **Jet startet** über die Köpfe), **Gleiter** vom Bahnende hinunter zum Strand; strahlender Sonnentag |
| Seepark | eigene Landschaft (Archetyp Freizeitpark am See) | Start auf der Promenade zwischen **Karussells**, **Wasserrutschen**, Buden und Ballons, dann hinunter in den See: langer Abschnitt **unter Wasser** (Seegras, Korallen, Riesenmuscheln, Fischschwärme, Quallen), Sprung aus dem Wasser, **Anti-Grav-Kurve** um das große **Riesenrad** mit Spin-Pfosten; Kirmes-Farben Blau, Pink, Gelb |
| Gipfelabfahrt | eigene Landschaft (Archetyp Winterberg), **Schneefall** | **Sektionsstrecke ohne Runden**: drei Abschnitte in einer langen Spirale vom Gipfel ins Tal, **Slalomtore** mit Turbo, Schneehügel als Trick-Buckel, rollende Schneebälle, Tannenwald, Hütten; unten schießt die **Fass-Kanone** die Karts mit dem Gleiter zurück auf den Gipfel ins Ziel |
| Knochendünen | eigene Wüste (Archetyp Wüste mit Riesenskeletten), **Abendlicht und Calima** | Über hohe **Sanddünen** (Buckel), durch die **Rippenbögen eines riesigen Skeletts**, an Schädeln vorbei, hinab durch die türkise **Oase** (unter Wasser) und am **Treibsand** entlang, der bremst; Ocker, Knochenweiß, Terrakotta |
| Lavafestung | eigene Vulkanlandschaft (Archetyp Vulkanburg), **Nacht** | Durch das **Festungstor**, die **Anti-Grav-Spirale** an den Burgmauern hinauf, an der riesigen **Drachenstatue** vorbei, deren **Steinfaust auf die Fahrbahn kracht**, und über die **Lavabrücke ohne Leitplanken** zwischen Lavaseen (hineinfahren = zurückgesetzt) |
| Sternenbahn | Weltall (Archetyp Regenbogenbahn), **Nacht** | Leuchtende **Regenbogen-Fahrbahn ohne Leitplanken** hoch über der Erde (wer hinunterfällt, wird zurückgeholt), **Anti-Gravitation** an der kreisenden **Raumstation**, Spin-Pfosten, Turbo-Felder und ein langer **Gleitflug** zwischen den Bahnen; Sterne und Planeten |
| Zuckerschlucht | eigene Landschaft (Archetyp Süßigkeiten-Canyon) | Zuckerguss-Hochebene mit riesigen **Torten**, Lutschern, Zuckerstangen, Donuts und Gummibärchen, hinunter in die **Keks-Schlucht**, über die **Waffelbrücke**, die **Anti-Grav-Steilwand** hinauf; **Puderzucker** neben der Fahrbahn bremst, **Schnappblumen** am Rand; Rosa, Minze, Vanille, Schoko |
| Loro Parque | Tierpark an der Ostküste | Thai-Tor, Papageien-Volieren, Flamingos, Gorillas, Tiger, Planet Penguin (Pinguine watscheln über die Straße), gläserner Hai-Tunnel, Delfin-Lagune, Seelöwen – und die **Orca-Show**: der Wal springt und spritzt eine Welle über die Fahrbahn (blauer Ring = gleich! nass = langsamer, „PLATSCH!“) |
| Piratenbucht | Südküste | **Eine Acht**: in der Mitte unten durch, später oben über die Holzbrücke. Piratenschiff in der Lagune, Piratenkanonen schießen Kanonenkugeln (roter Ring = Einschlag), rollende Pulverfässer, Krabben, Schatzinsel mit Totenkopf-Felsen, Leuchtturm |
| Tempelruinen | eigene Landschaft (Archetyp Dschungeltempel) | Lichtung, großes **Tempeltor**, Säulengang im Tempelhof mit herabkrachenden **Stampfsteinen**, hinab ins türkise **Tempelbecken** (unter Wasser), **Anti-Grav-Wand** an der **Stufenpyramide**, Steingesichter, Sprungkuppe; Sandstein, Moosgrün, Türkis, Gold |
| Delfinlagune | eigene Insel (Archetyp Ozean) | Start am Sandstrand, langer Abschnitt **unter Wasser** durch das **Korallenriff** und unter dem **Felsbogen** (Riesenmuscheln, Schildkröten, Mantas, Fischschwärme, Quallen), hinauf auf den **Holzsteg mit Wellen** (Anti-Gravitation), daneben **springen Delfine** |
| Spukvilla | eigene Landschaft (Archetyp Spukvilla), **Nacht** | Friedhofsgarten mit Grabsteinen, Kürbissen und Laternen, hinter dem Haus hinab in den **gefluteten Keller** (unter Wasser), die Treppe hinauf in den **Festsaal** (Anti-Gravitation, **Kronleuchter**, Tafeln, Gemälde, Spin-Pfosten) und mit dem **Gleiter aus dem Fenster**; Gespenster, Fledermäuse |
| Katzeninsel | Nachbarinsel im Südwesten | Die Strecke ist ein **großes Herz**: riesige schlafende Katze in der Mitte (atmet, Zzz), **Karton-Tunnel „MIAU!“** (oben spazieren Katzen), Kratzbäume, Winkekatzen, Näpfe, Kissen, Katzen in allen Fellfarben; Wollknäuel rollen, Mäuse flitzen, Kätzchen tapsen über die Fahrbahn |
| Hasenhügel | Westküste | Lange Schlängelrunde durch die Frühlingswiese: Möhrenbeete, Riesenmöhren, Hasenställe, Hasenlöcher mit Kaninchen, Windmühle, **durch den großen Hasenbau** (Erdröhre mit Wurzeln und Glühwürmchen); Kaninchen hoppeln über die Fahrbahn, bemalte Riesen-Eier rollen |
| Palmen-City | Nachbarinsel im Osten, **Großstadt** im Sonnenuntergang | **Acht mit Stadtautobahn-Brücke**, Hochhäuser, Neon-Türme und Neon-Schilder, Palmen, Tankstelle; **Verfolgungsjagd**: Polizeiautos mit Blaulicht und Stadtverkehr kreuzen die Fahrbahn, der Polizeihubschrauber kreist mit Suchscheinwerfer, Absperrungen, Sprungschanze |
| Mitternachts-Highway | Neon-Insel im Nordosten, **immer Nacht** (wie Need for Speed) | Breiter Boulevard durch den **Hafentunnel** mit orangen Tunnellampen, Haarnadel am Hafen, **Hochstraße** auf Stelzen mit grünen Schilderbrücken; **nasser, spiegelnder Asphalt** (Laternen und Neon spiegeln sich auf der Straße), Hochhäuser mit leuchtenden Fenstern, Neon-Reklame, Container; **Stadtverkehr fährt auf den Spuren mit** (mit Scheinwerfern und Rücklichtern), **Polizei mit Blaulicht** ist schneller und wechselt die Spur, Hubschrauber mit Suchscheinwerfer. |
| Teneriffa | Kanaren-Insel im Südosten | Start auf der **Strandpromenade** (Palmen, Laternen, Cafés, Paradiesvogelblumen, Sonnenschirme am Strand, das Hotel **Bahía Príncipe San Felipe** – vorn die Auffahrt mit Wendeschleife, Schild und Vordach, hinten der Poolgarten mit Lagunen-Pool und Holzbrücke, Leuchtschrift auf dem Dach –, gleich daneben der **Loro Parque** mit Thai-Eingang, Papageien, Flamingos, Orca-Becken mit springendem Orca, Planet Penguin und Gorillas, gegenüber am Meer die Becken des **Lago Martiánez** – wie in Puerto de la Cruz), Durchfahrt durch das **Einkaufszentrum** „Centro Comercial“ (Ladenzeilen auf zwei Etagen, Glasdach), **Serpentinen** mit Haarnadelkurven den **Teide** hinauf (Schneegipfel, Seilbahn, Kanarenkiefern, Lavafelsen, Ziegen auf der Straße), über den Kamm und hinunter in die **Altstadt mit engen Gassen** zwischen bunten Häusern mit Holzbalkonen, Kirche und Drachenbaum. Grüne **Guaguas** (Linienbusse) und Autos fahren mit. |
| Hafenstadt | Insel im Süden (nach dem Vorbild von **Toad-Hafen** aus Mario Kart 8 Deluxe) | Start an der **Hafenpromenade** (Kaimauer, Stege, Leuchtturm, Fässer, Kisten), dann **steil den Stadthügel hinauf** wie in San Francisco (4 m → 25 m), oben über **zwei scharfe Kuppen** – das Kart hebt ab –, die **Straßenbahnstraße** hinunter zum Markt mit Sonnenschirmen. Bunte Häuser dicht an den Hangstraßen, Uhrturm-Kirche am Platz, **Straßenbahnen** und Autos fahren mit. |
| Buckelpisten-Arena | Insel im Süden (nach dem Vorbild der **Excitebike-Arena**) | Stadion mit **Lehmpiste** in Schlangenlinien, ringsum **Tribünen voller Zuschauer**; auf den Geraden **Buckel auf Buckel** (bei Tempo springt man über jeden), auf der Gegengeraden **große Sprunghügel**, Schanze auf der Nordgeraden, Reifenstapel-Banden, Strohballen, Flutlichtmasten. |
| Schlossring | Schlossberg-Insel im Süden (nach dem Vorbild von **Royal Raceway**) | Start im Tal, **lange Auffahrt** am Hang des Schlossbergs hinauf (3 m → 28 m), oben am **Märchenschloss** mit roten Turmspitzen vorbei, dann über die blaue **Gleiter-Schanze** an der Bergkante: **Gleitflug über den See** hinunter ins Tal. |
| Wasserfall-Schlucht | Schluchtinsel im Norden (nach dem Vorbild von **Shy Guy Falls**) | Start unten in der **Schlucht am Fluss**, vorbei am **großen Wasserfall**, dann **steil die Felswand hinauf** auf das rote **Hochplateau** (4 m → 32 m) mit **Kristallmine** (bunte Kristalle, **Loren** rollen über die Strecke, holprige Gleise), an der Kante über die **Gleiter-Schanze** neben dem zweiten Wasserfall und im Gleitflug zurück in die Schlucht. |

**Modi**
- **Grand Prix** (Sonnen-, Blüten-, Sternen-, Muschel-, Blatt-, Kronen- und Kanaren-Cup): vier Strecken nacheinander, Punkte für 12 Fahrer,
  am Ende Siegerehrung mit Pokal.
- **Einzelrennen** und **Zeitfahren** (mit drei Turbo-Beeren, Bestzeiten werden gespeichert).

- **Mehrere Handys** (bis zu 12 Fahrer, Rest Computer): ein Handy ist Gastgeber und rechnet das Rennen, jeder Gast
  fährt sein eigenes Kart direkt (keine Eingabeverzögerung) und sieht die anderen nach Schnappschüssen des Gastgebers.
  - **Übers Internet, beliebig weit weg**: Gastgeber bekommt einen vierstelligen Raumcode (auch als QR-Code/Link
    `?join=CODE`), Gäste geben ihn unter „Beitreten“ ein (Vermittlung über einen öffentlichen MQTT-Server, danach
    direkte WebRTC-Verbindung; klappt die nicht – z. B. beide im Mobilfunk – laufen die Daten automatisch über den
    Vermittler weiter).
  - **In der Nähe, ganz ohne Netz** (Flugzeug): in der **iPhone-App** finden sich die Handys direkt per Bluetooth/WLAN
    (Apple MultipeerConnectivity) – Flugmodus an, WLAN und Bluetooth wieder einschalten, Spiel in der Liste antippen.
    Bauen und installieren: [ios/README.md](ios/README.md) – auch ohne Mac: GitHub baut eine `.ipa`, die man mit
    Sideloadly und kostenloser Apple-ID von Windows oder Mac aufs iPhone spielt. Im Browser gibt es kein Bluetooth.
  - **Ohne Internet im Browser**: alle Handys im selben WLAN; der Gastgeber zeigt einen QR-Code, der Gast scannt ihn
    und zeigt seinen Antwort-Code, den der Gastgeber scannt – kein Server nötig. Achtung: das iPhone kann im
    Flugmodus keinen Hotspot öffnen (viele Android-Handys schon).
- **Mehrspieler** für 2–4 Spieler im geteilten Bildschirm (zwei Spieler oben/unten, drei oder vier in vier Feldern):
  Beitreten in der Lobby mit A am Controller, Leertaste (Tastatur links) oder Enter (Tastatur rechts); jeder wählt
  seine Figur. Grand Prix und Rennen gehen zusammen. Läuft komplett auf einem Gerät –
  ohne Internet, also auch im Flugzeug.

Klassen: Gemütlich (50 ccm), Flott (100 ccm), Rasant (150 ccm).

**Grafik wie Mario Kart 8** (ab Grafikstufe „Hoch“): weiches Leuchten (Bloom) für helle und leuchtende Dinge,
kräftige Farben und Kontraste, warme Lichter und kühle Schatten, Vignette, Kantenglättung; helles **Randlicht** an
Figuren, Karts, Bäumen und Bauten. Auf allen Strecken: rot-weiße **Pfeilschilder** außen an engen Kurven,
**Reifenspuren** auf der Ideallinie, bunte **Wimpelketten** über den Geraden. Ungültige Pixelwerte (NaN/unendlich)
werden vor dem Leuchten herausgefiltert (über die Bits, da `isnan()` auf dem iPhone wegoptimiert wird) – sonst würde
ein einzelnes Pixel über den ganzen Bildschirm verschmiert und das Bild blitzte schwarz auf.

**Neue Strecken nach den Archetypen von Mario Kart 8 Deluxe** ersetzen nach und nach die bisherigen – der Plan
steht in [`docs/fahrplan-strecken.md`](docs/fahrplan-strecken.md). Mechaniken dafür: **Anti-Gravitation**
(`antigrav`: die Fahrbahn neigt sich in Kurven zur Steilkurve, blau leuchtende Kanten, die Räder klappen waagerecht,
blaues Leuchten unter dem Kart; Zusammenstöße geben beiden einen **Spin-Boost**), **Spin-Pfosten** (Gefahr `spinpost`),
**feste Tageszeit und festes Wetter je Strecke** (`time: 'day' | 'dusk' | 'night'`, `weather`; neu ist das Abendlicht –
in den Einstellungen „Wie die Strecke“ oder für alle Strecken Tag bzw. Nacht) und eine **eigene Landschaft je Strecke**
(`land: { sea, island, hills, flats, lakes }`), **Sektionsstrecken** ohne Runden (`sections: 3`, Anzeige
„Abschnitt“), eine **Fass-Kanone** (`cannons`: fester Flug in hohem Bogen mit Gleiter) und **Schneefall** als Wetter.

**Höhenprofile wie in Mario Kart 8 Deluxe**: Strecken können ein festes Höhenprofil haben (`heights` je
Kontrollpunkt, dazwischen stetig per Catmull-Rom) – das Gelände wird daran angeglichen (Dämme, Einschnitte, Böschungen
je nach Höhenunterschied), statt dass die Straße dem Gelände folgt. `bumps` legt Buckelpisten auf das Profil. Ist die
Fahrbahn stärker gewölbt, als die Schwerkraft das Kart bei seinem Tempo herumbiegen kann, **hebt es an der Kuppe ab**
(kleine Sprünge, über große Kuppen mit Trick). Blaue **Gleiter-Schanzen** (`glides`) öffnen einen bunten Gleiter: man
sinkt langsam, behält das Tempo und kann lenken; `flights` sind Abschnitte ohne Fahrbahn (über einen See oder in eine
Schlucht hinab).

**Tag und Nacht** (Einstellungen → Tageszeit): nachts haben alle Strecken einen Sternenhimmel mit Mond, entlang
aller Straßen leuchten **Laternen** mit warmen Lichtkegeln, die Karts fahren mit **Scheinwerfern**, Fenster, Neon und
Laternen strahlen. Zum Ausprobieren: `?night=1` an die Adresse hängen.

**Wetter** (Einstellungen → Wetter: Sonne, Regen, Calima oder Zufall): bei **Regen** grauer Himmel, schräg fallende
Tropfen, nasse Straßen mit Pfützen, Gischt hinter den Rädern, Scheinwerfer an und Regenrauschen; bei **Calima**
(Saharastaub wie auf den Kanaren) ockerfarbener Dunst, blasse Sonne, kurze Sicht und treibende Staubkörner – auf
Teneriffa kommt Calima bei „Zufall“ öfter vor. Zum Ausprobieren: `?weather=rain` oder `?weather=calima`.

**Karte**: Die Nahkarte dreht mit (vorn ist oben), der Weg voraus ist gelb mit Pfeilen; Antippen/Klicken wechselt
zur ganzen Strecke. Kommt eine Kurve oder ist man abseits, zeigt ein gelber Pfeil „Hier entlang“.

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
| Hüpfer & Driften | Leertaste / Shift (geradeaus halten = Aufladesprung) | R | **GAS pumpen** (Gas – los – Gas) startet den Drift, dann Gas halten und lenken, loslassen = Mini-Turbo; deutlich zur anderen Seite lenken beendet den Drift, neu pumpen = Drift in die neue Richtung (Automatik-Gas: Knopf **DRIFT**). Richtung: Daumen beim Hüpfer ein Stück zur Seite (auch kurz nach der Landung); im Drift ist die Daumenstellung vom Driftbeginn der mittlere Bogen – weiter hinein = enger, zur Mitte = weiter, ganz dagegen = aufrichten und leicht gegenlenken |
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

URL-Parameter für Tests: `?race=<strecke>&racer=<id>&cc=50|100|150&laps=n`, `?mode=gp|trial`, `?quality=1|2|3`,
Mehrspieler `?players=lotti:kb1,greta:pad0`. `node tools/draw-world.mjs <strecke>` zeichnet die Karte einer
Strecken-Welt.

### Aufbau

```
src/
  main.js             Renderer, Hauptschleife, Rennen starten/beenden
  game/               Race (Ablauf, Kamera, Wertung), Racer (Kart-Physik, Drift, Treffer), ai.js (Computer-Fahrer),
                      items.js (Kisten, Bitcoins, Geschosse), hazards.js (Gegner auf der Strecke), drivers.js
                      (Figuren im Kart), kartModel.js, effects.js (Partikel), audio.js (Motor, Musik), Ceremony.js
  world/              worldDef.js (Landschaftsplan: Strecken, See, Berge, Regionen, Schienen; courseWorldDef),
                      World (Höhenfeld, Oberflächen, Kollisionen), WorldView (Darstellung), backdrop.js
                      (Fernsicht), Track, Sky, decor.js
  game/RacePath.js    Rennpfad (Startaufstellung, Runden, Auslauf)
  tracks/             Streckendefinitionen (Kontrollpunkte, Kisten, Turbo-Felder, Schanzen, Gefahren, Kulisse)
  ui/                 Menüs, HUD mit Minikarte, Touch-Steuerung, Eingabe, Symbole aus den 3D-Modellen
  lgw/                übernommene Module aus LottiGretaWorld (Figuren, Modelle, Musik und Effekte)
```

Eine neue Strecke ist eine Datei in `src/tracks/` (geschlossener Kurs aus Kontrollpunkten `[x, z, halbe Breite]`)
und ein Platz in der Landschaft (`courses` in `src/world/worldDef.js`).

## Veröffentlichen

`.github/workflows/deploy.yml` baut bei jedem Push auf den Standard-Branch (bzw. `main`/`master`) und veröffentlicht auf
GitHub Pages unter https://alex1977-code.github.io/LottiGretaKart/ (einmalig: Settings → Pages → Source „GitHub Actions“).
