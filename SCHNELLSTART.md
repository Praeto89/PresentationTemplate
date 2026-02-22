# Schnellstart-Anleitung

## Präsentation öffnen

### Variante A – Batch-Dateien (empfohlen, Windows)

| Datei | Zweck |
|---|---|
| `start_presentation.bat` | Startet HTTP-Server auf Port 8000 und öffnet die Präsentation im Browser |
| `start_edit_mode.bat` | Startet zusätzlich den Save-Server (`save_server.py`, Port 8001) und öffnet im Edit-Mode |

> Die Batch-Dateien nutzen die Python-Version aus `config.bat`. Dort kann der Pfad angepasst werden.

### Variante B – Manuell

1. Terminal im Projektordner öffnen
2. HTTP-Server starten:
   ```bash
   python -m http.server 8000
   ```
3. Browser öffnen: `http://localhost:8000`

## Navigation

| Taste / Aktion | Funktion |
|---|---|
| ← → ↑ ↓ | Zwischen Slides navigieren |
| Leertaste | Nächste Slide |
| ESC | Übersichtsmodus (alle Slides) |
| F | Vollbildmodus |
| S | Speaker-Notes (neues Fenster) |
| H / Home | Zurück zum Hauptmenü |
| End | Zur Abschluss-Slide springen |
| Klick auf Kreis-Thema | Direkter Sprung zum Thema |
| "Zurück zum Menü"-Button | Auf jeder Content-Slide verfügbar |

## Edit-Mode

### Aktivierung

| Methode | Anleitung |
|---|---|
| **URL-Parameter** | `?mode=edit` an URL anhängen, z.B. `http://localhost:8000?mode=edit` |
| **Batch-Datei** | `start_edit_mode.bat` ausführen (macht alles automatisch) |
| **Tastenkombination** | `Strg+E` während der Präsentation |

### Was kann bearbeitet werden?

- **Übersicht**: Übertitel und Untertitel direkt anklicken und bearbeiten
- **Kreis-Themen**: Titel der Themen im Kreis-Menü anklicken
- **Content-Slides**: Überschriften und Texte auf jeder Slide anklicken
- **Erweiterte Nav-Boxen**: Auch in aufgeklappten Navigations-Boxen editierbar

Editierbare Felder werden beim Hovern visuell hervorgehoben.

### Änderungen speichern

Änderungen werden automatisch im **localStorage** des Browsers gespeichert und bleiben beim Neuladen erhalten.

Für permanentes Speichern (HTML-Export):
1. Der Save-Server muss laufen (`save_server.py` auf Port 8001)
2. `start_edit_mode.bat` startet diesen automatisch
3. Über die Export-Funktion kann die Datei gespeichert werden

## Animationen

| Animation | Wann |
|---|---|
| Buch-Öffnung | Beim Start der Präsentation (3D-Flip + Zoom) |
| Kreis-Menü | Themen kreisförmig angeordnet mit Hover-Effekten |
| Spiral-Zoom | Beim Klick auf ein Thema (Rotation + Zoom + Farbwechsel) |
| Buch-Schließung | Button "Buch schließen" auf Abschluss-Slide |

## Layer-System (Schüler-Ebenen)

Das Projekt enthält ein Layer-System für personalisierte Schüler-Inhalte:

- **Schüler-Verwaltung**: Schüler hinzufügen/entfernen
- **Eigene Inhalte**: Jeder Schüler kann eigene Texte und Medien auf Slides ablegen
- **Drag & Drop**: Inhalte per Drag & Drop positionieren

Details: siehe `LAYER_SYSTEM_DOCS.md` und `QUICK_START_LAYERS.md`

## Offline-Nutzung

Die Präsentation funktioniert komplett offline:
- Alle Reveal.js-Plugins in `plugin/`
- Keine CDN- oder Internet-Abhängigkeiten
- Einfach kompletten Ordner kopieren und auf beliebigem Gerät öffnen

## Troubleshooting

| Problem | Lösung |
|---|---|
| Buch-Animation startet nicht | Browser-Konsole prüfen (F12), Cache leeren |
| Themen werden nicht angezeigt | `data/content.json` auf Syntax prüfen |
| Edit-Mode reagiert nicht | URL enthält `?mode=edit`? Server läuft? |
| Änderungen gehen verloren | Edit-Mode nutzen, Save-Server für permanentes Speichern starten |
| Batch-Datei startet nicht | Python-Pfad in `config.bat` prüfen |

## Customization

| Was | Wo |
|---|---|
| Farben & Design-Tokens | `styles/tokens.css` |
| Haupt-Layout | `css/presentation.css` |
| Edit-Mode Styles | `css/editor.css` |
| Themen & Inhalte | `data/content.json` |
| Kreis-Berechnung | `js/modules/menu.js` (passt sich automatisch an Anzahl Themen an) |
| Animationen | `css/presentation.css` – `transition`/`@keyframes` anpassen |

## Weiterführende Dokumentation

- `README.md` – Technische Übersicht und Modulstruktur
- `VISION.md` – Konzept und Designphilosophie
- `FEATURE_MAP.md` – Feature-Modul-Zuordnung
- `LAYER_SYSTEM_DOCS.md` – Layer-System Architektur
- `QUICK_START_LAYERS.md` – Schnelleinstieg Layer-System
