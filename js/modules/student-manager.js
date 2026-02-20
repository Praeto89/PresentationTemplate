/**
 * ════════════════════════════════════════════════════════════════════════════
 * STUDENT MANAGER - Verwaltet mehrere Schüler/Layer
 * Ermöglicht Aktivierung/Deaktivierung von Layer-Modus und Wechsel zwischen Schülern
 * ════════════════════════════════════════════════════════════════════════════
 */

const STORAGE_KEYS = {
  LAYER_MODE_ENABLED: 'layerModeEnabled',
  LAYER_COUNT: 'layerCount',
  STUDENT_CONFIGS: 'studentConfigs',
  CURRENT_STUDENT: 'currentStudent',
};

let studentConfigs = [];
let currentStudentIndex = 0;
let layerModeEnabled = false;

/**
 * Initialisiert das Student-Manager Modul
 * Lädt gespeicherte Konfiguration aus localStorage
 */
export function initStudentManager() {
  // Lade Einstellungen aus localStorage
  const savedLayerMode = localStorage.getItem(STORAGE_KEYS.LAYER_MODE_ENABLED);
  const savedLayerCount = localStorage.getItem(STORAGE_KEYS.LAYER_COUNT);
  const savedConfigs = localStorage.getItem(STORAGE_KEYS.STUDENT_CONFIGS);
  const savedCurrentStudent = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
  
  layerModeEnabled = savedLayerMode === 'true' ? true : false;
  const layerCount = savedLayerCount ? parseInt(savedLayerCount) : 0;
  
  if (savedConfigs) {
    try {
      studentConfigs = JSON.parse(savedConfigs);
      console.log('[StudentManager] Loaded', studentConfigs.length, 'students from localStorage');
    } catch (e) {
      console.error('[StudentManager] Error parsing student configs:', e);
      studentConfigs = [];
    }
  }
  
  if (savedCurrentStudent) {
    currentStudentIndex = parseInt(savedCurrentStudent);
  }
}

/**
 * Prüft, ob Layer-Modus aktiviert ist
 * @returns {boolean}
 */
export function isLayerModeEnabled() {
  return layerModeEnabled;
}

/**
 * Aktiviert/Deaktiviert den Layer-Modus
 * @param {boolean} enabled - True zum Aktivieren, false zum Deaktivieren
 */
export function setLayerMode(enabled) {
  layerModeEnabled = enabled;
  localStorage.setItem(STORAGE_KEYS.LAYER_MODE_ENABLED, enabled.toString());
  
  if (!enabled) {
    // Layer-Modus deaktiviert: lösche Schüler-Konfigurationen
    studentConfigs = [];
    currentStudentIndex = 0;
    localStorage.removeItem(STORAGE_KEYS.STUDENT_CONFIGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    localStorage.setItem(STORAGE_KEYS.LAYER_COUNT, '0');
  }
  
  console.log('[StudentManager] Layer mode set to:', enabled);
}

/**
 * Gibt die aktuelle Anzahl der Schüler zurück
 * @returns {number}
 */
export function getLayerCount() {
  return studentConfigs.length;
}

/**
 * Erstellt neue Schüler-Konfigurationen
 * @param {number} count - Anzahl neuer Schüler (1-25)
 * @param {boolean} clearExisting - Wenn true, werden existierende Schüler gelöscht
 */
export function createStudentConfigs(count, clearExisting = true) {
  if (count < 1 || count > 25) {
    console.error('[StudentManager] Invalid student count:', count);
    return;
  }
  
  if (clearExisting) {
    studentConfigs = [];
  }
  
  // Bestimme die Anzahl zu erstellender Schüler
  const existingCount = studentConfigs.length;
  const startId = clearExisting ? 0 : existingCount;
  
  for (let i = startId; i < count; i++) {
    studentConfigs.push({
      id: i,
      name: `Schüler ${i + 1}`,
      topicCount: 8,
      detailSlidesPerTopic: 3,
      slideEdits: {},
      bookmarks: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    });
  }
  
  // Speichere in localStorage
  localStorage.setItem(STORAGE_KEYS.STUDENT_CONFIGS, JSON.stringify(studentConfigs));
  localStorage.setItem(STORAGE_KEYS.LAYER_COUNT, studentConfigs.length.toString());
  
  console.log('[StudentManager] Created', count, 'student configs');
}

/**
 * Gibt den aktuellen Schüler zurück, oder null wenn Layer-Modus aus
 * @returns {Object|null}
 */
export function getCurrentStudent() {
  if (!layerModeEnabled || studentConfigs.length === 0) {
    return null;
  }
  
  return studentConfigs[currentStudentIndex] || null;
}

/**
 * Gibt einen spezifischen Schüler zurück
 * @param {number} index - Index des Schülers (0-basiert)
 * @returns {Object|null}
 */
export function getStudentConfig(index) {
  if (index < 0 || index >= studentConfigs.length) {
    return null;
  }
  
  return studentConfigs[index];
}

/**
 * Gibt alle Schüler-Konfigurationen zurück
 * @returns {Array}
 */
export function getAllStudents() {
  return [...studentConfigs];
}

/**
 * Gibt den aktuellen Schüler-Index zurück
 * @returns {number}
 */
export function getCurrentStudentIndex() {
  return currentStudentIndex;
}

/**
 * Aktualisiert Konfiguration eines Schülers
 * @param {number} index - Index des Schülers
 * @param {Object} updates - Zu aktualisierende Felder
 */
export function updateStudentConfig(index, updates) {
  if (index < 0 || index >= studentConfigs.length) {
    console.error('[StudentManager] Invalid student index:', index);
    return;
  }
  
  studentConfigs[index] = {
    ...studentConfigs[index],
    ...updates,
    lastModified: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEYS.STUDENT_CONFIGS, JSON.stringify(studentConfigs));
  console.log('[StudentManager] Updated student', index, updates);
}

/**
 * Löscht einen Schüler
 * @param {number} index - Index des zu löschenden Schülers
 */
export function deleteStudent(index) {
  if (index < 0 || index >= studentConfigs.length) {
    console.error('[StudentManager] Invalid student index:', index);
    return;
  }
  
  studentConfigs.splice(index, 1);
  
  // Passe currentStudentIndex an, falls nötig
  if (currentStudentIndex >= studentConfigs.length && studentConfigs.length > 0) {
    currentStudentIndex = studentConfigs.length - 1;
  } else if (studentConfigs.length === 0) {
    currentStudentIndex = 0;
  }
  
  localStorage.setItem(STORAGE_KEYS.STUDENT_CONFIGS, JSON.stringify(studentConfigs));
  localStorage.setItem(STORAGE_KEYS.LAYER_COUNT, studentConfigs.length.toString());
  localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, currentStudentIndex.toString());
  
  console.log('[StudentManager] Deleted student at index', index);
}

/**
 * Wechselt zu einem anderen Schüler
 * @param {number} index - Index des neuen Schülers
 * @returns {Object|null} - Der neue Schüler oder null
 */
export function switchStudent(index) {
  if (!layerModeEnabled || index < 0 || index >= studentConfigs.length) {
    console.error('[StudentManager] Cannot switch to student:', index);
    return null;
  }
  
  currentStudentIndex = index;
  localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, index.toString());
  
  console.log('[StudentManager] Switched to student', index, '-', studentConfigs[index].name);
  
  return studentConfigs[index];
}

/**
 * Ändert die Anzahl der Layer (mit Warnung bei Reduktion)
 * @param {number} newCount - Neue Anzahl Layer (1-25)
 * @param {Function} confirmCallback - Callback für Bestätigung bei Reduktion
 */
export function updateLayerCount(newCount, confirmCallback) {
  if (newCount < 1 || newCount > 25) {
    console.error('[StudentManager] Invalid layer count:', newCount);
    return;
  }
  
  const currentCount = studentConfigs.length;
  
  if (newCount < currentCount) {
    // Layer werden gelöscht - frage nach Bestätigung
    const confirmDelete = confirmCallback 
      ? confirmCallback(currentCount - newCount, currentCount, newCount)
      : confirm(`${currentCount - newCount} Schüler würden gelöscht. Fortfahren?`);
    
    if (!confirmDelete) {
      console.log('[StudentManager] Layer count change cancelled');
      return;
    }
    
    // Lösche überschüssige Schüler
    studentConfigs = studentConfigs.slice(0, newCount);
    
    // Passe currentStudentIndex an
    if (currentStudentIndex >= studentConfigs.length) {
      currentStudentIndex = studentConfigs.length - 1;
    }
  } else if (newCount > currentCount) {
    // Füge neue Schüler hinzu
    const startIndex = currentCount;
    for (let i = startIndex; i < newCount; i++) {
      studentConfigs.push({
        id: i,
        name: `Schüler ${i + 1}`,
        topicCount: 8,
        detailSlidesPerTopic: 3,
        slideEdits: {},
        bookmarks: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });
    }
  }
  
  localStorage.setItem(STORAGE_KEYS.STUDENT_CONFIGS, JSON.stringify(studentConfigs));
  localStorage.setItem(STORAGE_KEYS.LAYER_COUNT, studentConfigs.length.toString());
  localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, currentStudentIndex.toString());
  
  console.log('[StudentManager] Layer count updated to:', newCount);
}

/**
 * Speichert den State eines Schülers (Slide-Edits, Lesezeichen)
 * @param {number} index - Index des Schülers
 * @param {Object} state - { slideEdits, bookmarks }
 */
export function saveStudentState(index, state) {
  if (index < 0 || index >= studentConfigs.length) {
    console.error('[StudentManager] Invalid student index:', index);
    return;
  }
  
  if (state.slideEdits) {
    studentConfigs[index].slideEdits = state.slideEdits;
  }
  if (state.bookmarks) {
    studentConfigs[index].bookmarks = state.bookmarks;
  }
  
  studentConfigs[index].lastModified = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.STUDENT_CONFIGS, JSON.stringify(studentConfigs));
  
  console.log('[StudentManager] Saved state for student', index);
}

/**
 * Lädt den State eines Schülers
 * @param {number} index - Index des Schülers
 * @returns {Object} - { slideEdits, bookmarks }
 */
export function loadStudentState(index) {
  if (index < 0 || index >= studentConfigs.length) {
    return { slideEdits: {}, bookmarks: [] };
  }
  
  const student = studentConfigs[index];
  return {
    slideEdits: student.slideEdits || {},
    bookmarks: student.bookmarks || [],
  };
}

/**
 * Ordnet Schüler um (Drag-Drop Support)
 * @param {number} fromIndex - Ausgangsindex
 * @param {number} toIndex - Zielindex
 */
export function reorderStudents(fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= studentConfigs.length ||
      toIndex < 0 || toIndex >= studentConfigs.length) {
    console.error('[StudentManager] Invalid reorder indices:', fromIndex, toIndex);
    return;
  }
  
  // Verschiebe Element
  const [movedStudent] = studentConfigs.splice(fromIndex, 1);
  studentConfigs.splice(toIndex, 0, movedStudent);
  
  // Aktualisiere IDs
  studentConfigs.forEach((student, index) => {
    student.id = index;
    student.name = student.name.replace(/Schüler \d+/, `Schüler ${index + 1}`);
  });
  
  // Passe currentStudentIndex an
  if (currentStudentIndex === fromIndex) {
    currentStudentIndex = toIndex;
  } else if (fromIndex < currentStudentIndex && toIndex >= currentStudentIndex) {
    currentStudentIndex--;
  } else if (fromIndex > currentStudentIndex && toIndex <= currentStudentIndex) {
    currentStudentIndex++;
  }
  
  localStorage.setItem(STORAGE_KEYS.STUDENT_CONFIGS, JSON.stringify(studentConfigs));
  localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, currentStudentIndex.toString());
  
  console.log('[StudentManager] Reordered students:', fromIndex, '->', toIndex);
}
