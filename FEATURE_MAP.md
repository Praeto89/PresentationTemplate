# Feature Map

Quelle: aktueller Code (Stand 2025-07).

## Entry Point & Reveal-Initialisierung

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| Reveal.js Init | `presentation.js` | `Reveal.initialize()` mit Plugins (Markdown, Highlight, Notes, Math, Search, Zoom), Hash-Navigation, Keyboard-Config |
| Content-Loading | `presentation.js` → `storage.js` | Lädt `data/content.json`, Fallback aus DOM |
| Modul-Bootstrap | `presentation.js` | Importiert und initialisiert alle Module nach `Reveal.ready` |
| Circle-Setup | `presentation.js` | Erstellt Kreis-Menü-Elemente, Klick-Handler für Themen-Navigation |
| Nav-Box Expand/Collapse | `presentation.js` | `expandBox()` / `collapseBox()` mit Custom-Event `navbox-expanded` |

## Navigation

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| Keyboard-Navigation | `navigation.js` | ESC, Home/H, End, Pfeiltasten; blockiert während Animationen |
| Topic-Navigation | `navigation.js` | `navigateToTopic()`, `returnToMainMenu()` via `Reveal.slide()` |
| Buch schließen/öffnen | `navigation.js` | `closeBook()`, `reopenBook()` auf Abschluss-Slide |

## Menü & Kreis-Layout

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| Kreisförmiges Menü | `menu.js` | `computeLayout()`, `applyLayoutToCSS()`, `initMenu()` – responsive Radius/Tile-Size |
| Mindmap-Kinder | `menu.js` | Child-Tiles mit SVG-Bézier-Linien (`updateMindmapLines`) |
| Hover/Focus States | `menu.js` | `updateTileVisibilityByState()`, Glow-Effekte |
| Bookmarks | `menu.js` → `storage.js` | localStorage-basierte Lesezeichen pro Child-Tile |
| Menü-Layout-Berechnung | `menu-layout.js` | Ergänzende Layout-Logik für Menü-Positionierung |

## Viewport & Kamera

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| State Machine | `viewport-controller.js` | States: idle → focusing → focused → returning |
| Zoom-Animationen | `viewport-controller.js` | Zoom-In/Out mit easeOutExpo, reduced-motion Support |
| Keyboard Guard | `viewport-controller.js` | Deaktiviert Reveal-Keyboard während Focus |
| Kamera-Steuerung | `camera-controller.js` | Erweiterte Kamera-Transformationen und Übergänge |

## Layout Engine

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| Dynamisches Layout | `layout-engine.js` | Berechnung und Anwendung von Slide-Layouts |

## Edit-Mode

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| Aktivierung | `edit-mode.js` | URL `?mode=edit` oder `Strg+E` Toggle; orchestriert alle Edit-Features |
| Inline-Editing | `slide-editor.js` | `makeEditable()` auf Titeln, Texten, Circle-Texten; Reveal-Keyboard wird bei Focus deaktiviert |
| Expanded Nav-Box Editing | `slide-editor.js` | Listener für `navbox-expanded` Event, `enableEditingInContainer()` |
| localStorage-Persistenz | `slide-editor.js` → `storage.js` | Änderungen in `getSlideEdits()` / `saveSlideEdits()` gespeichert |
| HTML-Export | `export-html.js` | Speichert bearbeitete Präsentation via `save_server.py` (Port 8001) |
| PDF-Export | `pdf-export.js` | Export der Präsentation als PDF |

## Content & Persistenz

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| JSON-Daten laden | `storage.js` | `loadContent()` – fetcht `data/content.json` |
| Slide-Edits speichern | `storage.js` | localStorage-Key für Inline-Änderungen |
| Bookmarks | `storage.js` | `getBookmarks()`, `toggleBookmarkStorage()` |
| Content Import/Export | `storage.js` | File System Access API mit Download-Fallback |

## Layer-System (Schüler-Ebenen)

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| Schüler-Verwaltung | `student-manager.js` | Schüler hinzufügen, entfernen, auswählen |
| Schüler-UI | `student-ui.js` | UI-Komponenten für Schüler-Auswahl und -Anzeige |
| Layer-Controller | `student-layer-controller.js` | Aktiviert/deaktiviert Schüler-Ebenen auf Slides |
| Drag & Drop | `student-drag-drop.js` | Positionierung von Schüler-Inhalten per Drag & Drop |

## Slide-Generierung

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| Slide-Generator | `slide-generator.js` | Dynamische Erzeugung von Slides aus Content-Daten |
| Subtopic-Detail | `subtopic-detail.js` | Detail-Ansichten für Unterthemen |

## UI-Komponenten

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| Admin-Panel | `admin-panel.js` | Kontroll-Panel im Edit-Mode |
| Overlay | `overlay.js` | Overlay-System für modale Inhalte |
| Benachrichtigungen | `utils/notification.js` | Toast-Benachrichtigungen für User-Feedback |

## Utilities

| Feature | Datei(en) | Beschreibung |
|---|---|---|
| Mathematik | `utils/math.js` | Geometrie-Berechnungen (Kreis, Positionen) |
| Normalisierung | `utils/normalize.js` | Daten-Normalisierung und Validierung |

## Styling

| Datei | Zweck |
|---|---|
| `css/presentation.css` | Haupt-Layout, Reveal-Overrides, Animationen, Buch-Effekte |
| `css/editor.css` | Edit-Mode Styles (editable-field, Hover-States) |
| `styles/tokens.css` | Design-Tokens (Farben, Spacing, Typografie) |
| `styles/mindmap.css` | Mindmap-SVG-Linien und Child-Tile Styles |
| `styles/menu.css` | Kreis-Menü Layout und Tile-Styles |
| `styles/motion.css` | Animations- und Transitions-Definitionen |

## Reveal.js Plugins

| Plugin | Pfad | Funktion |
|---|---|---|
| Markdown | `plugin/markdown/` | Markdown-Rendering in Slides |
| Highlight | `plugin/highlight/` | Syntax-Highlighting (Monokai/Zenburn) |
| Notes | `plugin/notes/` | Speaker-Notes mit eigenem Fenster |
| Math | `plugin/math/` | KaTeX / MathJax Formeln |
| Search | `plugin/search/` | Volltextsuche in Slides |
| Zoom | `plugin/zoom/` | Klick-Zoom auf Slide-Elemente |

## Konfiguration

| Datei | Zweck |
|---|---|
| `js/config/index.js` | Zentrale JS-Konfigurationswerte |
| `config.bat` | Python-Pfad für Batch-Dateien |
| `data/content.json` | Inhaltsdaten (Themen, Slides, Texte) |
