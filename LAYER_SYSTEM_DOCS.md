# Multi-Student Layer System - Dokumentation

## Überblick

Das neue Multi-Student Layer System ermöglicht es, 8 bis 25 verschiedene Schüler-Layer in einer Präsentation zu verwalten. Jeder Schüler kann eine unterschiedliche Anzahl von Kreisen/Themen (3-12) haben, eigene Slide-Edits und eigene Lesezeichen.

## Features

### 1. **Layer-Modus aktivieren/deaktivieren**
- Im Edit-Mode (`Strg+E`) → Tab "Schüler"
- Toggle: "Layer-Modus aktivieren"
- Wenn aktiv: Dropdown auf der Übersichtsfolie (oben-links) erscheint

### 2. **Schüler verwalten**
- **Schüler-Anzahl festlegen** (1-25)
  - Number-Input: Anzahl Schüler
  - Button: "Aktualisieren"
  - Warnung bei Reduktion: zeigt an, wie viele Schüler gelöscht werden

- **Schüler selektieren & bearbeiten**
  - Dropdown: aktuellen Schüler wählen
  - Textfeld: Name des Schülers editierbar
  - Number-Input: Anzahl Kreise (3-12) für diesen Schüler
  - Button: "Speichern & Neu laden"

- **Schüler löschen**
  - Button: "Aktuellen Schüler löschen"
  - Warnung: "Alle Edits gehen verloren"

### 3. **Schüler-Umordnung (Drag-Drop)**
- Im "Schüler"-Tab: Liste der Schüler mit Nummern
- Schüler anklicken & ziehen um Reihenfolge zu ändern
- Automatisch persistiert in localStorage

### 4. **Layer-Wechsel mit Auto-Save**
- Dropdown auf Übersichtsfolie (Slide 0) nutzen
- Automatisches Speichern von:
  - Slide-Edits
  - Lesezeichen
  - Einstellungen des aktuellen Schülers
- Präsentation wird automatisch für neuen Schüler regeneriert

### 5. **PDF-Export**
- Button im Edit-Mode "Schüler"-Tab: "📄 PDF-Export"
- Öffnet Anleitung für Reveal.js `?print-pdf` Mode
- Schritte:
  1. PDF-Export-Modus öffnen (Button in Anleitung)
  2. `Strg+P` / `Cmd+P` drücken
  3. "Als PDF speichern" wählen
  4. Speichern

## Datenstruktur

### localStorage Keys:

```javascript
// Layer-Modus-Einstellungen
layerModeEnabled: boolean         // Layer-Modus aktiv?
layerCount: number (1-25)         // Anzahl Schüler
currentStudent: number (0-24)     // Index des aktuellen Schülers

// Schüler-Konfigurationen
studentConfigs: [
  {
    id: number,                   // 0-24
    name: string,                 // z.B. "Schüler 1"
    topicCount: number (3-12),    // Anzahl Kreise
    detailSlidesPerTopic: number, // Standard: 3
    slideEdits: {                 // Pro Schüler isoliert
      "selector": "html content"
    },
    bookmarks: [                  // Pro Schüler isoliert
      { parentId, childIndex }
    ],
    createdAt: ISO Date String,
    lastModified: ISO Date String
  }
  // ... weitere Schüler ...
]
```

## Module

### Neue Module:

1. **`js/modules/student-manager.js`**
   - Zentrale Verwaltung von Schüler-Konfigurationen
   - Funktionen: `getCurrentStudent()`, `switchStudent()`, `updateStudentConfig()`, etc.

2. **`js/modules/student-layer-controller.js`**
   - Behandelt Schülerwechsel und Auto-Save
   - Regeneriert Präsentation bei Layer-Wechsel
   - Aktualisiert Dropdown-Optionen

3. **`js/modules/student-drag-drop.js`**
   - Drag-Drop für Schüler-Umordnung
   - Automatische Persistierung

4. **`js/modules/pdf-export.js`**
   - PDF-Export-Anleitung Modal
   - Integration mit Reveal.js `?print-pdf` Mode

### Geänderte Module:

1. **`js/modules/storage.js`**
   - Neue Funktionen: `saveStudentSlideEdits()`, `loadStudentSlideEdits()`, etc.
   - Unterstützung für Pro-Schüler Isolation

2. **`js/modules/slide-generator.js`**
   - Student-Config in `generateAllTopicSlides()` und `generateCompleteSlidesHTML()`
   - Nutzt `student.topicCount` falls verfügbar

3. **`js/modules/edit-mode.js`**
   - Neue Tab "Schüler" mit vollständiger Verwaltungs-UI
   - Integration aller Student-Manager-Funktionen

4. **`presentation.js`**
   - Initialisiert `student-manager` vor anderen Modulen
   - Ruft `initStudentLayerController()` auf

5. **`index.html`**
   - Student-Dropdown auf Slide 0 (oben-links, versteckt wenn Layer-Modus aus)

6. **`css/editor.css`**
   - Styling für Student-Manager-UI
   - Drag-Drop-Visualisierung

## Workflow für Elterngespräche

### Setup:
1. Edit-Mode öffnen (`Strg+E`)
2. Tab "Schüler"
3. "Layer-Modus aktivieren" 
4. Anzahl Schüler eingeben (z.B. 8)
5. "Aktualisieren" klicken
6. Für jeden Schüler:
   - Name ändern (z.B. "Max Mustermann")
   - Anzahl Kreise festlegen (falls unterschiedlich)
   - Inhalte bearbeiten (wie normal)
7. Änderungen werden automatisch in localStorage gespeichert; für permanentes Speichern den Save-Server nutzen (`start_edit_mode.bat`)

### Präsentation durchführen:
1. Präsentation öffnen
2. Dropdown auf Slide 0 (oben-links): aktuellen Schüler wählen
3. Alle Inhalte laden sich automatisch
4. Bei nächstem Schüler: Dropdown wechseln (Auto-Save)
5. PDF exportieren wenn gewünscht (Edit-Mode → PDF-Export Button)

## Technische Details

### Auto-Save Mechanismus
- Beim Layer-Wechsel:
  1. Slide-Edits des alten Schülers in `studentConfigs[oldIndex].slideEdits` speichern
  2. Lesezeichen des alten Schülers speichern
  3. Zu neuem Schüler wechseln
  4. Neue Slide-Edits aus `studentConfigs[newIndex].slideEdits` laden
  5. HTML regenerieren mit `generateCompleteSlidesHTML()`
  6. Reveal.js neu laden

### Daten-Isolation
- Jeder Schüler hat **separate** Slide-Edits
- Jeder Schüler hat **separate** Lesezeichen
- Änderungen an Schüler A beeinflussen Schüler B nicht

### PDF-Export
- Nutzt Reveal.js built-in `?print-pdf` Mode
- Öffnet neues Fenster mit `?print-pdf` URL
- Benutzer öffnet Druckdialog und speichert als PDF
- Dateiname kann vom Benutzer angepasst werden

## Einschränkungen & Bekannte Einstellungen

- **Max. 25 Schüler**: localStorage-Limit
- **Kreisanzahl**: 3-12 pro Schüler (Reveal.js-Einschränkung)
- **Browser-Abhängigkeit**: Funktioniert am besten in Chrome/Chromium
- **localStorage Limit**: Bei vielen Edits kann Speicher voll laufen (Browser-spezifisch)

## Häufig gestellte Fragen

**F: Kann ich die Struktur später noch ändern?**
A: Ja, im Edit-Mode unter "Schüler" → Layer-Anzahl anpassen oder Kreise pro Schüler ändern

**F: Gehen Edits verloren wenn ich Layer lösche?**
A: Ja, beim Löschen eines Schülers gehen alle seine Edits verloren (Warnung wird angezeigt)

**F: Kann ich Schüler aus verschiedenen Präsentationen kombinieren?**
A: Nicht direkt, aber du kannst Schüler-Configs manuell in localStorage kopieren (fortgeschrittene Nutzer)

**F: Wie viele Schüler-Daten passen in localStorage?**
A: Abhängig vom Browser (meist 5-10MB), mit vielen Edits pro Schüler etwa 5-15 Schüler

## Debugging

### Aktiviere Debug-Modus:
```javascript
// In Browser-Konsole:
localStorage.setItem('DEBUG_STUDENT_MANAGER', 'true');
// Alle Student-Manager Logs erscheinen in Konsole
```

### Anzeige aktueller Schüler-Config:
```javascript
// In Browser-Konsole:
const { getAllStudents, getCurrentStudent } = 
  await import('./js/modules/student-manager.js');
console.log(getCurrentStudent());
console.log(getAllStudents());
```

### Reset zu Standard:
```javascript
// In Browser-Konsole (warnung: löscht alle Schüler-Daten):
localStorage.removeItem('layerModeEnabled');
localStorage.removeItem('layerCount');
localStorage.removeItem('studentConfigs');
localStorage.removeItem('currentStudent');
location.reload();
```

## Zukunftserweiterungen (Optional)

- [ ] Export/Import von Schüler-Konfigurationen als JSON
- [ ] Cloud-Speicherung für Backup
- [ ] Automatischer Papierkorb für gelöschte Schüler (Undo)
- [ ] Template-System für Schüler-Vorlagen
- [ ] Automatische PDF-Batch-Exporte
- [ ] Zeitstempel für Änderungsverlauf pro Schüler
