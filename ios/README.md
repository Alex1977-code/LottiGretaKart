# Lotti & Greta Kart als iPhone-App

Die App ist dasselbe Spiel wie im Browser (Capacitor verpackt den Web-Build `dist/`), kann aber zusätzlich
**Handys in der Nähe direkt verbinden** – über Apples MultipeerConnectivity (Bluetooth und WLAN von Gerät zu
Gerät). Das braucht kein Internet und keinen Router und klappt deshalb auch **im Flugzeug**:
Flugmodus an, dann WLAN und Bluetooth wieder einschalten.

- Mehrspieler → *Spiel erstellen*: das Spiel ist sofort „in der Nähe“ sichtbar (z. B. „Spiel von Lotti (42)“).
- Mehrspieler → *Beitreten*: Spiele in der Nähe erscheinen als Liste – antippen, fertig.
- Beim ersten Mal fragt iOS nach „Geräte im lokalen Netzwerk finden“ – bitte **Erlauben**.
- Bis zu 8 Geräte (Gastgeber + 7 Gäste). Raumcode übers Internet geht in der App weiterhin.

Nativer Teil: `native/lgk-nearby` (Swift-Plugin), JavaScript-Seite: `src/net/nearby.js`.

## Weg A – mit einem Mac (kostenlos, für die eigenen Geräte)

1. Xcode aus dem App Store installieren, im Projektordner:
   ```sh
   npm install
   npm run ios          # baut das Spiel und kopiert es ins iOS-Projekt
   npx cap open ios     # öffnet Xcode
   ```
2. In Xcode: Projekt *App* → *Signing & Capabilities* → *Team*: die eigene Apple-ID wählen (kostenlos).
   Falls die Bundle-ID schon vergeben ist, eine eigene eintragen, z. B. `de.familiename.lottigretakart`.
3. iPhone per Kabel anschließen, oben als Ziel wählen, ▶ drücken. Auf dem iPhone einmal
   *Einstellungen → Datenschutz & Sicherheit → Entwicklermodus* einschalten und dem Entwickler vertrauen
   (*Einstellungen → Allgemein → VPN & Geräteverwaltung*).
4. Für jedes weitere iPhone wiederholen. Mit einer kostenlosen Apple-ID läuft die App **7 Tage**,
   danach einfach nochmal aus Xcode installieren.

## Weg B – ohne Mac, über GitHub und TestFlight (Apple-Entwicklerkonto, 99 €/Jahr)

Der Workflow `.github/workflows/ios.yml` baut die App auf einem Mac von GitHub. Ohne weitere Einstellungen
macht er nur einen Prüf-Build. Mit Apple-Konto lädt er jede Version zu TestFlight hoch:

1. Beim [Apple Developer Program](https://developer.apple.com/programs/) anmelden.
2. In [App Store Connect](https://appstoreconnect.apple.com) → *Apps* → **+** eine neue App anlegen,
   Bundle-ID `de.lottigreta.kart` (oder eine eigene – dann die GitHub-Variable `IOS_BUNDLE_ID` setzen).
3. App Store Connect → *Benutzer und Zugriff* → *Integrationen* → *App Store Connect API* → Schlüssel mit der
   Rolle **App Manager** erzeugen, die `.p8`-Datei herunterladen.
4. Im GitHub-Repository → *Settings → Secrets and variables → Actions* anlegen:
   `APPLE_TEAM_ID`, `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_KEY_P8` (Inhalt der .p8-Datei).
5. *Actions → iPhone-App bauen → Run workflow*. Nach ein paar Minuten (plus Apples Prüfung, meist < 1 Stunde)
   erscheint der Build in TestFlight. Familie/Freunde als Tester einladen, sie installieren die App über die
   **TestFlight**-App. TestFlight-Builds laufen 90 Tage.

## Grenzen

- Die Verbindung „in der Nähe“ gibt es nur in der iPhone-App (und auf dem iPad). Im Browser bleibt es bei
  Raumcode (Internet) und QR-Kopplung (gemeinsames WLAN). Ein Browser-Handy und ein App-Handy finden sich
  nicht „in der Nähe“ – dafür beide die App nutzen oder den Raumcode.
- Android-Handys bräuchten eine eigene App (Google Nearby Connections) – noch nicht eingebaut.
