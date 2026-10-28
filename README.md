# QR-Code-Generator

Eine schlanke Web-App zum Erstellen von QR-Codes – ohne Anmeldung, ohne Server, ohne Tracking. Alle QR-Codes werden direkt im Browser erzeugt; eingegebene Daten (z. B. WLAN-Passwörter) verlassen das Gerät nicht.

## Funktionen

Die Startseite (`index.html`) führt zu vier „Activities“, eine pro QR-Code-Typ:

| Activity | Ordner | Was im QR-Code steckt |
| --- | --- | --- |
| **Text & Link** | `text/` | Beliebiger Text oder eine URL. Beim Scannen wird der Link geöffnet bzw. der Text angezeigt. Ein Button fügt den Inhalt direkt aus der Zwischenablage ein. |
| **WLAN** | `wlan/` | Netzwerkname, Passwort, Verschlüsselung (WPA/WEP/offen) und ob das Netz versteckt ist. Smartphones verbinden sich nach dem Scannen direkt. |
| **Kontakt** | `kontakt/` | Eine digitale Visitenkarte (vCard 3.0) mit Name, Firma, Telefon, E-Mail, Webseite und Adresse. Nur ausgefüllte Felder werden übernommen. |
| **E-Mail** | `email/` | Ein `mailto:`-Link mit Empfänger, Betreff und Nachricht. Beim Scannen öffnet sich das Mailprogramm mit vorausgefüllter E-Mail. |

In jeder Activity gilt:

- **Live-Vorschau** – der QR-Code aktualisiert sich bei jeder Eingabe.
- **Darstellung** (aufklappbar):
  - **Größe** von 256 bis 2048 px für den Export
  - **Fehlerkorrektur** von 7 % bis 30 % – je höher, desto robuster ist der Code gegen Verschmutzung oder ein aufgedrucktes Logo, desto dichter wird er aber auch
  - **Vorder- und Hintergrundfarbe** (auf ausreichend Kontrast achten, sonst lässt sich der Code schlecht scannen)
- **Export**:
  - **PNG** – Rastergrafik für Web, Chat und Dokumente
  - **SVG** – Vektorgrafik, beliebig skalierbar, ideal für den Druck
  - **Kopieren** – legt den QR-Code als Bild in die Zwischenablage
- Umlaute, Sonderzeichen und Emojis werden als UTF-8 kodiert und korrekt übertragen.
- Ist der Inhalt zu lang für einen QR-Code, erscheint ein Hinweis.
- Helles und dunkles Design passen sich automatisch der Systemeinstellung an.

## Aufbau

```
index.html          Startseite mit Links zu den Activities
style.css           Design der Startseite
favicon.svg         Icon im Browser-Tab (wird von allen Seiten genutzt)
text/               Activity „Text & Link“
  index.html
  scripts.js
  style.css
wlan/               Activity „WLAN“
kontakt/            Activity „Kontakt“
email/              Activity „E-Mail“
```

Jede Activity ist in sich abgeschlossen und hat ihre eigene `index.html`, `scripts.js` und `style.css`.

## Funktionsweise

Die App ist reines HTML, CSS und JavaScript, ohne Build-Schritt und ohne Framework.

1. **Eingabe → Text:** Die Funktion `getData()` in der `scripts.js` jeder Activity baut aus den Formularfeldern den Text, der im QR-Code gespeichert wird. Nur hier unterscheiden sich die Activities:
   - Text & Link: der eingegebene Text unverändert
   - WLAN: `WIFI:T:WPA;S:<Name>;P:<Passwort>;;` – Sonderzeichen wie `;` oder `:` werden mit `\` maskiert
   - Kontakt: eine vCard (`BEGIN:VCARD … END:VCARD`)
   - E-Mail: `mailto:<Empfänger>?subject=…&body=…` mit URL-kodierten Werten
2. **Text → QR-Matrix:** Die Bibliothek [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (per CDN eingebunden) berechnet daraus die Modul-Matrix. Die QR-Version (Größe des Rasters) wird automatisch passend zur Datenmenge und Fehlerkorrektur gewählt.
3. **Matrix → Bild:** Die App zeichnet die Module selbst auf ein `<canvas>` (für Vorschau, PNG und Kopieren) bzw. erzeugt daraus ein SVG. Rundherum bleibt eine Ruhezone von 4 Modulen, wie vom QR-Standard empfohlen.

Da die App nur aus statischen Dateien besteht, lässt sie sich auf jedem beliebigen Webhosting betreiben oder lokal durch Öffnen der `index.html` im Browser nutzen. Eine Internetverbindung wird nur zum Laden der QR-Bibliothek vom CDN benötigt.
