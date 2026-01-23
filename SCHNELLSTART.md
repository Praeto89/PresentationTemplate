# Schnellstart-Anleitung

**Hinweis**: Admin-Modus und Kachel-Menü beziehen sich auf eine Legacy-Variante (index-legacy.html) und sind in der aktiven Präsentation (index.html) nicht enthalten. Aktive Styles befinden sich in css/presentation.css.

## Präsentation öffnen

1. Öffnen Sie `index.html` in einem modernen Browser (Chrome, Edge, Firefox, Safari)
2. Die Präsentation startet automatisch mit der Buch-Öffnungs-Animation

## Navigation

### Grundlegende Navigation
- **Pfeiltasten** ← → ↑ ↓: Zwischen Slides navigieren
- **Leertaste**: Nächste Slide
- **ESC**: Übersichtsmodus
- **F**: Vollbildmodus

### Spezielle Navigation
- **Kachel anklicken**: Direkter Sprung zum Thema mit Spiral-Zoom
- **H oder Home**: Zurück zum Hauptmenü
- **End**: Zur Abschluss-Slide springen
- **"Zurück zum Menü" Button**: Auf jeder Content-Slide verfügbar

## Admin-Modus

### Aktivierung
1. **URL-Parameter**: Fügen Sie `?mode=admin` zur URL hinzu
  - Beispiel: `file:///C:/Users/USERNAME/reveal-thesis-presentation/index.html?mode=admin`
2. **Tastenkombination**: Drücken Sie `Strg+E` während der Präsentation

### Funktionen im Admin-Modus
- **Titel bearbeiten**: Klicken Sie auf Titel, Untertitel, Autor auf der Intro-Slide
- **Kacheln bearbeiten**: Klicken Sie auf Kachel-Titel im Hauptmenü
- **Content bearbeiten**: Klicken Sie auf Topic-Titel und Inhalte
- **Exportieren**: Speichert Änderungen als JSON-Datei
- **Importieren**: Lädt JSON-Datei mit neuen Inhalten

### Änderungen speichern
1. Klicken Sie auf "Inhalt exportieren"
2. **Chrome/Edge**: Wählen Sie Speicherort (kann direkt `data/content.json` überschreiben)
3. **Firefox/Safari**: Datei wird heruntergeladen, ersetzen Sie manuell `data/content.json`

## Struktur der Content-Datei

`data/content.json` enthält alle editierbaren Inhalte:

```json
{
  "title": "Ihr Titel",
  "subtitle": "Ihr Untertitel",
  "author": "Ihr Name",
  "topics": [
    {
      "id": 1,
      "title": "Thema-Name",
      "color": "#4CAF50",
      "slides": [...]
    }
  ],
  "closingMessage": "Danke-Nachricht"
}
```

## Animationen

### Buch-Öffnung (Intro)
- Automatisch beim Start
- 3D-Flip-Effekt mit Zoom zum Titel

### Hauptmenü
- Grüner Hintergrund mit Verlauf
- 6 Kacheln im Kreis angeordnet
- Hover-Effekt: Vergrößerung und Schatten

### Spiral-Zoom (Topic-Übergang)
- Beim Klick auf Kachel
- Rotation + Zoom + Skalierung
- Farbwechsel: Grün → Hellblau mit Wolken

### Buch-Schließung (Abschluss)
- Button "Buch schließen" auf letzter Slide
- Reverse 3D-Transformation
- "Danke"-Text auf Buchrücken

## Offline-Nutzung

Die Präsentation funktioniert komplett offline:
- Alle Reveal.js-Dateien sind in `dist/` und `plugin/` enthalten
- Keine CDN- oder Internet-Abhängigkeiten
- Einfach kompletten Ordner kopieren und auf beliebigem Gerät öffnen

## GitHub Pages Deployment

### Einfache Methode
1. Erstellen Sie ein Repository auf GitHub
2. Führen Sie folgende Befehle aus:
   ```bash
   git remote add origin https://github.com/IhrUsername/IhrRepo.git
   git push -u origin master
   ```
3. GitHub → Repository → Settings → Pages
4. Source: "Deploy from branch"
5. Branch: `master`, Folder: `/ (root)`
6. Speichern und warten (~2 Minuten)

URL: `https://IhrUsername.github.io/IhrRepo/`

## Troubleshooting

### Buch-Animation startet nicht
- Warten Sie 500ms nach dem Laden
- Prüfen Sie Browser-Konsole (F12) auf Fehler

### Kacheln werden nicht angezeigt
- Stellen Sie sicher, dass `data/content.json` existiert
- Prüfen Sie Browser-Konsole auf JSON-Parsing-Fehler

### Admin-Modus funktioniert nicht
- Chrome/Edge: File System Access API vollständig unterstützt
- Firefox/Safari: Nutzen Sie Download/Upload-Fallback

### Änderungen gehen verloren
- Im Admin-Modus: Immer "Inhalt exportieren" klicken
- Ersetzen Sie `data/content.json` mit exportierter Datei
- Aktualisieren Sie die Seite

## Tipps für die Präsentation

1. **Vorbereitung**: Testen Sie alle Animationen vorher
2. **Vollbild**: Drücken Sie `F` für Vollbildmodus
3. **Sprecher-Notizen**: Drücken Sie `S` für Speaker-View (neues Fenster)
4. **Übersicht**: `ESC` zeigt alle Slides auf einmal
5. **Direkte Navigation**: Nutzen Sie Kacheln für flexibles Springen zwischen Themen

## Customization

### Farben ändern
- `css/presentation.css`: CSS-Variablen für Farben und Hintergründe
- `data/content.json`: `color` Eigenschaft für Kachel-Akzente

### Mehr/Weniger Kacheln
- `data/content.json`: Topics hinzufügen/entfernen
- `js/modules/menu.js`: Circle-Berechnung passt sich automatisch an

### Animations-Geschwindigkeit
- `css/presentation.css`: `transition`/`animation` Dauer und `@keyframes` Timing anpassen

## Support

Bei Fragen oder Problemen:
1. Prüfen Sie Browser-Konsole (F12)
2. Lesen Sie Kommentare in JavaScript-Modulen
3. Konsultieren Sie `VISION.md` für Konzept-Details
4. Konsultieren Sie `README.md` für technische Details
