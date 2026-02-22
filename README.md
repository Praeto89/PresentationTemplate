# Reveal.js Präsentation – Master Thesis Template

Interaktive Präsentation mit Reveal.js, kreisförmiger Themen-Navigation, Nav-Box Detail-Ansichten, Multi-Schüler Layer-System und integriertem Edit-Mode.

## Features

- **Kreisförmige Übersicht**: Themenkreise auf einer zentralen Spiral-Übersicht mit Hover-Bildern
- **Group Intros mit Nav-Boxes**: Jedes Thema hat eine Übersichtsseite mit klickbaren, expandierbaren Detail-Karten
- **Inline Edit-Mode**: Texte direkt im Browser bearbeiten (`Ctrl+E` oder `?mode=edit`)
- **Multi-Schüler Layer-System**: Separate Präsentationen pro Schüler mit eigenen Inhalten und Kreisanzahlen
- **HTML-Export**: Änderungen per `Ctrl+S` direkt in die HTML-Datei schreiben (via Save-Server)
- **PDF-Export**: Export-Guide für druckbare PDF-Versionen
- **Offline-fähig**: Funktioniert komplett ohne Internetverbindung
- **Responsive**: Optimiert für 16:9 und Breitbild-Displays
- **Hintergrundbild**: Automatische Erkennung aus `assets/background/`

## Projektstruktur

```
MasterThesis/
├── index.html                  # Hauptdatei (Reveal.js Slides)
├── presentation.js             # Einstiegspunkt (Reveal-Init, Navigation, Kreise)
├── save_server.py              # Python-Server für HTML-Speicherung (Port 8001)
├── start_presentation.bat      # Startet Präsentation (Port 8000)
├── start_edit_mode.bat         # Startet Edit-Mode (Port 8000 + 8001)
├── config.bat                  # Python-Konfiguration
├── package.json                # Node.js Dependencies
├── eslint.config.js            # ESLint-Konfiguration
│
├── js/
│   ├── config/
│   │   └── index.js            # Zentrale Konfiguration (Animationen, Layout, etc.)
│   └── modules/
│       ├── edit-mode.js        # Edit-Mode Orchestrator
│       ├── slide-editor.js     # Inline-Editing & Nav-Box Sync
│       ├── export-html.js      # Ctrl+S HTML-Export via Save-Server
│       ├── admin-panel.js      # Kreis-Titel, Slide-Generierung, Menu-Admin
│       ├── overlay.js          # Overlay/Tab-System für Edit-Mode
│       ├── menu.js             # Menü-Rendering & Datenstruktur
│       ├── menu-layout.js      # Menü-Layout-Berechnungen
│       ├── navigation.js       # Tastatur-Navigation & Escape-Handling
│       ├── camera-controller.js # Zoom-Animation State Machine
│       ├── viewport-controller.js # Wrapper für Camera & Layout
│       ├── layout-engine.js    # Mindmap-Layout & Kollisionserkennung
│       ├── storage.js          # localStorage & content.json Verwaltung
│       ├── student-manager.js  # Schüler-Datenverwaltung
│       ├── student-layer-controller.js # Schüler-Wechsel & Slide-Neuladen
│       ├── student-ui.js       # Schüler-Verwaltungs-UI im Overlay
│       ├── student-drag-drop.js # Drag-Drop Schüler-Reihenfolge
│       ├── slide-generator.js  # Automatische Slide-Generierung
│       ├── subtopic-detail.js  # Detail-Panel für Subtopics
│       ├── pdf-export.js       # PDF-Export Guide
│       └── utils/
│           ├── math.js         # Mathematische Hilfsfunktionen
│           ├── normalize.js    # Daten-Normalisierung
│           └── notification.js # Toast-Benachrichtigungen
│
├── css/
│   ├── presentation.css        # Haupt-Styles (Kreise, Nav-Boxes, Slides)
│   └── editor.css              # Edit-Mode Styles (Overlay, Buttons, Editing)
│
├── styles/
│   ├── tokens.css              # Design-Tokens (Farben, Abstände, Animationen)
│   ├── mindmap.css             # Mindmap-spezifische Styles
│   ├── menu.css                # Menü-Styles
│   └── motion.css              # Animations-Styles
│
├── data/
│   └── content.json            # Editierbarer Inhalt (Topics, Subtopics)
│
├── assets/
│   └── background/             # Hintergrundbilder (automatisch erkannt)
│
├── dist/                       # Reveal.js Core (generiert via npm install)
└── plugin/                     # Reveal.js Plugins (highlight, markdown, math, notes, search, zoom)
```

## Installation

```bash
git clone https://github.com/Praeto89/PresentationTemplate.git
cd PresentationTemplate
npm install
```

`npm install` lädt Reveal.js herunter und kopiert `dist/` und `plugin/` automatisch.

## Starten

### Präsentation (Nur Anzeige)

```bash
start_presentation.bat
```

Startet einen Python HTTP-Server auf Port 8000 und öffnet `http://localhost:8000` im Browser.

### Edit-Mode (Bearbeiten & Speichern)

```bash
start_edit_mode.bat
```

Startet:
- **Save-Server** auf Port 8001 (`save_server.py` – ermöglicht `Ctrl+S` Speicherung)
- **HTTP-Server** auf Port 8000
- Öffnet `http://localhost:8000/index.html?mode=edit` im Browser

### Manueller Start

```bash
python -m http.server 8000
```

Dann im Browser: `http://localhost:8000` (Präsentation) oder `http://localhost:8000/index.html?mode=edit` (Edit-Mode).

## Edit-Mode

Aktivierung: `?mode=edit` in der URL oder `Ctrl+E` während der Präsentation.

| Funktion | Beschreibung |
|----------|-------------|
| **Texte bearbeiten** | Klick auf Titel, Untertitel, Absätze → direkt editieren |
| **Übersicht bearbeiten** | Haupttitel, Untertitel und Kreis-Texte auf Slide 0 |
| **Nav-Box Inhalte** | Expandierte Nav-Boxes sind editierbar |
| **Kreis-Einstellungen** | ⚙️-Button → Anzahl, Grösse, Positionierung |
| **Schüler verwalten** | 👥-Button → Layer-System, Drag-Drop Reihenfolge |
| **Menu verwalten** | Overlay → Tab "Menu verwalten" → Subtopics, Titel |
| **Speichern** | `Ctrl+S` → exportiert in HTML (benötigt Save-Server) |

## Navigation

| Taste | Aktion |
|-------|--------|
| `→` Pfeil rechts | Nächstes Thema (Group Intro) |
| `←` `↑` `↓` Pfeile | Hover-Vorschau der Detail-Slides |
| `Esc` | Zurück zur Übersicht |
| Klick auf Kreis | Zum Thema navigieren |
| Klick auf Nav-Box | Detail-Inhalt expandieren |
| `Ctrl+E` | Edit-Mode ein/ausschalten |
| `Ctrl+S` | HTML exportieren (im Edit-Mode) |

## Multi-Schüler Layer-System

Ermöglicht separate Präsentationen pro Schüler. Siehe [QUICK_START_LAYERS.md](QUICK_START_LAYERS.md) für eine Schnellanleitung und [LAYER_SYSTEM_DOCS.md](LAYER_SYSTEM_DOCS.md) für die technische Dokumentation.

**Kurzübersicht:**
1. Edit-Mode aktivieren (`Ctrl+E` oder `?mode=edit`)
2. Tab "Schüler" → Layer-Modus aktivieren
3. Schüler hinzufügen, benennen, Kreisanzahl setzen
4. Schüler-Dropdown (oben links) zum Wechseln

## Anpassung

| Was | Wo |
|-----|-----|
| Farben & Abstände | [styles/tokens.css](styles/tokens.css) |
| Kreis-Styles | [css/presentation.css](css/presentation.css) |
| Edit-Mode UI | [css/editor.css](css/editor.css) |
| Layout-Parameter | [js/config/index.js](js/config/index.js) |
| Inhalte | [data/content.json](data/content.json) oder Edit-Mode |
| Hintergrundbild | Datei in `assets/background/` ablegen |

## Browser-Kompatibilität

- **Chrome / Edge**: Volle Unterstützung
- **Firefox**: Volle Unterstützung
- **Safari**: Volle Unterstützung

## Deployment (GitHub Pages)

1. Repository auf GitHub erstellen
2. Pushen: `git push -u origin master`
3. Settings → Pages → Branch `master`, Ordner `/ (root)` → Save

Die Präsentation ist dann verfügbar unter: `https://<username>.github.io/<repo-name>/`

## Lizenz

MIT License
