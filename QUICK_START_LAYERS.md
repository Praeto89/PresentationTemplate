# QUICK START - Multi-Student Layer System

## In 5 Minuten einrichten:

### 1. Edit-Mode öffnen
```
Strg+E  (oder Ctrl+E)
```
Oder URL: `?mode=edit`

### 2. Zum "Schüler"-Tab wechseln
- Im Edit-Mode Overlay oben nach "Schüler"-Tab suchen

### 3. Layer-Modus aktivieren
- Checkbox: "Layer-Modus aktivieren" ☑️

### 4. Schüler-Anzahl festlegen
- Number-Input: z.B. `8` (für 8 Schüler)
- Button: "Aktualisieren"

### 5. Schüler bearbeiten
Für jeden Schüler:
1. Dropdown: Schüler auswählen
2. Name-Feld: Namen eingeben (z.B. "Anna Schmidt")
3. Kreisanzahl: Falls unterschiedlich (sonst Standard 8)
4. "Speichern & Neu laden"
5. Slide-Inhalte im normalen Edit-Mode bearbeiten (`Strg+E`)

### 6. Präsentation durchführen
- Präsentation öffnen/starten
- **Dropdown oben-links auf Slide 0**: Schüler wählen
- Alle Inhalte des Schülers laden sich automatisch
- ✅ Auto-Save beim Wechsel

## Was sich gerade geändert hat:

| Funktion | Wo | Wie |
|----------|------|------|
| **Layer aktivieren** | Edit-Mode → "Schüler"-Tab | Checkbox |
| **Schüler verwalten** | Edit-Mode → "Schüler"-Tab | Vollständige UI |
| **Wechsel in Präsentation** | Dropdown auf Slide 0 | Automatisches Laden |
| **PDF-Export** | Edit-Mode → "Schüler"-Tab → PDF-Button | Guide Modal |
| **Drag-Drop** | Edit-Mode → "Schüler"-Tab → Liste | Ziehen & Ablegen |

## Struktur

```
Eine Präsentation
├── Layer-Modus ON/OFF
├── Schüler 1 (z.B. "Anna")
│   ├── 8 Kreise
│   ├── Eigene Slide-Edits
│   └── Eigene Lesezeichen
├── Schüler 2 (z.B. "Bero")
│   ├── 6 Kreise
│   ├── Eigene Slide-Edits
│   └── Eigene Lesezeichen
└── ... Schüler 3-25
```

## Tipps & Tricks

### 💾 Speichern nicht vergessen!
- Nach Änderungen im Edit-Mode: `Strg+S` oder File → Save
- Alle Schüler-Konfigurationen werden in Browser-Storage gespeichert (lokal)

### 🔄 Schüler-Reihenfolge ändern
- Im Edit-Mode → "Schüler"-Tab
- Unter "Schüler (zum Umordnen ziehen)" Liste anschauen
- Schüler anklicken & ziehen → Reihenfolge ändert sich sofort

### 📄 PDF für alle Schüler exportieren
- Für jeden Schüler:
  1. Dropdown wählen
  2. Edit-Mode → "Schüler"-Tab → "PDF-Export"
  3. Modal-Anleitung folgen
  4. Drucken zu PDF

### ⚠️ Schüler löschen
- Vorsicht! Alle Edits gehen verloren
- Warnung wird angezeigt
- Keine Rückgängigmachung möglich

### 🎨 Name & Kreisanzahl pro Schüler anpassen
- Jeder Schüler kann **unterschiedliche Kreisanzahl** haben (3-12)
- Namen können frei gewählt werden
- Wirkt sich automatisch auf Präsentation aus

## Häufige Fehler

### ❌ Dropdown auf Slide 0 ist nicht sichtbar
- Layer-Modus muss aktiviert sein
- Edit-Mode → "Schüler"-Tab → "Layer-Modus aktivieren"
- Dann Präsentation neu laden

### ❌ Änderungen gehen verloren beim Schülerwechsel
- **Sollte nicht vorkommen** - Auto-Save ist aktiv!
- Falls doch: Browser-Cache leeren und neu laden

### ❌ localStorage voll (zu viele Edits)
- Browser-Limit (meist 5-10MB)
- Lösung: alte Präsentationen löschen oder Browser wechseln

### ❌ Reveal.js Fehler beim Reload
- Edit-Mode schließen und neuladen: `F5` oder Cmd+R

## Technische Infos

- **Speicherung:** Browser localStorage (lokal)
- **Backup:** Regelmäßig mit File→Export sichern
- **Module:** Siehe [LAYER_SYSTEM_DOCS.md](LAYER_SYSTEM_DOCS.md)
- **Debug:** Browser-Konsole öffnen (F12) für Logs

## Support

- Für detaillierte Infos: [LAYER_SYSTEM_DOCS.md](LAYER_SYSTEM_DOCS.md)
- Für Debuggen: Browser-Konsole (F12) öffnen
- Fehler melden: Konsolen-Logs kopieren

---

**Viel Spaß mit dem neuen Multi-Student Layer System! 🎓**
