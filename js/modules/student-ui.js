/**
 * ════════════════════════════════════════════════════════════════════════════
 * STUDENT UI
 * Builds and wires the "Schüler verwalten" tab inside the overlay.
 * Handles layer-mode toggle, student CRUD, name/topic-count editing,
 * PDF export trigger and drag-drop list rendering.
 * ════════════════════════════════════════════════════════════════════════════
 */

import { setTabContent } from './overlay.js';
import {
  getContentData,
  saveIndexHTML,
} from './storage.js';
import {
  isLayerModeEnabled,
  setLayerMode,
  getLayerCount,
  updateLayerCount,
  getCurrentStudent,
  getCurrentStudentIndex,
  getStudentConfig,
  updateStudentConfig,
  deleteStudent,
  getAllStudents,
} from './student-manager.js';
import {
  handleStudentSwitch,
  reloadPresentationForStudent,
  updateStudentDropdown,
  toggleStudentDropdownVisibility,
} from './student-layer-controller.js';
import { showPDFExportGuide } from './pdf-export.js';
import { showNotification } from './utils/notification.js';

/* ── public API ─────────────────────────────────────────────────────────── */

/**
 * Build the Student Manager tab HTML and wire all event listeners.
 */
export function setupStudentManagerUI() {
  const studentManagerHTML = `
    <div class="student-manager-section">
      <h3>Layer-Modus Einstellungen</h3>
      
      <div class="setting-group">
        <label>
          <input type="checkbox" id="layer-mode-toggle" ${isLayerModeEnabled() ? 'checked' : ''}>
          <span>Layer-Modus aktivieren</span>
        </label>
      </div>
      
      <div id="layer-controls">
        <h4>Schüler verwalten</h4>
        
        <div class="setting-group">
          <button id="deactivate-layer-mode-btn" class="admin-btn-danger" style="margin-bottom: 15px;">⚠️ Layer-Modus deaktivieren</button>
          <p style="font-size: 0.9em; color: #666; margin-top: 5px;">Alle Schülerdaten werden gelöscht!</p>
        </div>
        
        <div class="setting-group">
          <label for="layer-count-input">Anzahl Schüler (1-25):</label>
          <input 
            type="number" 
            id="layer-count-input" 
            min="1" 
            max="25" 
            value="${getLayerCount()}"
            style="width: 60px; padding: 5px;"
          >
          <button id="layer-count-update-btn" class="admin-btn-primary" style="margin-left: 10px;">Aktualisieren</button>
        </div>
        
        <div class="setting-group">
          <label for="student-select-edit">Schüler selektieren:</label>
          <select id="student-select-edit" style="padding: 5px; min-width: 200px;">
            <!-- Dynamisch gefüllt -->
          </select>
        </div>
        
        <div class="setting-group">
          <label for="student-name-input">Name des aktuellen Schülers:</label>
          <input 
            type="text" 
            id="student-name-input" 
            placeholder="z.B. Schüler 1"
            style="padding: 5px; width: 200px;"
          >
          <button id="student-name-save-btn" class="admin-btn-primary" style="margin-left: 10px;">Speichern</button>
        </div>
        
        <div class="setting-group">
          <label>
            <input type="checkbox" id="use-student-name-as-title">
            <span>Schülername als Titel in Übersichtsfolie anzeigen</span>
          </label>
        </div>
        
        <div class="setting-group">
          <label for="student-topic-count-input">Anzahl Kreise für aktuellen Schüler (3-12):</label>
          <input 
            type="number" 
            id="student-topic-count-input" 
            min="3" 
            max="12"
            value="8"
            style="width: 60px; padding: 5px;"
          >
          <button id="student-topic-count-save-btn" class="admin-btn-primary" style="margin-left: 10px;">Speichern & Neu laden</button>
        </div>
        
        <div class="setting-group">
          <button id="student-delete-btn" class="admin-btn-danger" style="margin-top: 10px;">Aktuellen Schüler löschen</button>
          <button id="student-reload-btn" class="admin-btn-primary" style="margin-left: 10px;">Präsentation neu laden</button>
          <button id="pdf-export-btn" class="admin-btn-primary" style="margin-left: 10px;">📄 PDF-Export</button>
        </div>
        
        <!-- Student List mit Drag-Drop -->
        <div id="student-list-container"></div>
      </div>
    </div>
  `;

  setTabContent('students', studentManagerHTML);
  setupStudentManagerListeners();
  updateStudentSelectDropdown();

  // Initialise Drag-Drop (with Error Handling)
  try {
    import('./student-drag-drop.js')
      .then(({ initStudentDragDrop, renderStudentList }) => {
        if (isLayerModeEnabled() && getLayerCount() > 0) {
          renderStudentList();
          initStudentDragDrop();
        }
      })
      .catch((error) => {
        console.warn('[StudentUI] Error loading student drag-drop module:', error);
      });
  } catch (error) {
    console.warn('[StudentUI] Error initializing drag-drop:', error);
  }
}

/* ── internal: event listeners ──────────────────────────────────────────── */

function setupStudentManagerListeners() {
  try {
    setupLayerModeToggle();
    setupDeactivateButton();
    console.log('[StudentUI] All student manager listeners setup complete');
  } catch (error) {
    console.error('[StudentUI] Error in setupStudentManagerListeners:', error);
  }

  setupLayerCountUpdate();
  setupStudentSelect();
  setupStudentNameSave();
  setupUseTitleCheckbox();
  setupStudentTopicCount();
  setupStudentDelete();
  setupReloadAndPdf();
}

/* ── layer mode toggle ──────────────────────────────────────────────────── */

function setupLayerModeToggle() {
  const layerModeToggle = document.getElementById('layer-mode-toggle');
  const layerControls = document.getElementById('layer-controls');

  if (!layerModeToggle || !layerControls) return;

  layerControls.style.display = isLayerModeEnabled() ? 'block' : 'none';

  layerModeToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    setLayerMode(isEnabled);
    layerControls.style.display = isEnabled ? 'block' : 'none';
    toggleStudentDropdownVisibility();

    if (isEnabled && getLayerCount() === 0) {
      const layerCountInput = document.getElementById('layer-count-input');
      if (layerCountInput) layerCountInput.value = 0;
    }
  });
}

/* ── deactivate button (delegated) ──────────────────────────────────────── */

function setupDeactivateButton() {
  try {
    const tabContent =
      document.getElementById('students-content') ||
      document.querySelector('.overlay-tab-content');
    if (!tabContent) return;

    tabContent.addEventListener('click', (e) => {
      if (
        e.target.id === 'deactivate-layer-mode-btn' ||
        e.target.closest('#deactivate-layer-mode-btn')
      ) {
        const layerControls = document.getElementById('layer-controls');
        const layerModeToggle = document.getElementById('layer-mode-toggle');

        const confirmed = confirm(
          '⚠️ WARNUNG: Layer-Modus deaktivieren?\n\n' +
            'Dies wird ALLE ' +
            getLayerCount() +
            ' Schüler und ihre Daten (Markierungen, Lesezeichen, Notizen) löschen!\n\n' +
            'Diese Aktion kann nicht rückgängig gemacht werden.\n\n' +
            'Möchten Sie fortfahren?',
        );

        if (confirmed) {
          setLayerMode(false);
          if (layerControls) layerControls.style.display = 'none';
          if (layerModeToggle) layerModeToggle.checked = false;
          toggleStudentDropdownVisibility();
          showNotification(
            'Layer-Modus deaktiviert. Alle Schülerdaten wurden gelöscht.',
            'success',
          );
        }
      }
    });
  } catch (buttonError) {
    console.error('[StudentUI] Error setting up deactivate button:', buttonError);
  }
}

/* ── layer count update (delegated) ─────────────────────────────────────── */

function setupLayerCountUpdate() {
  const handleUpdate = () => {
    const layerCountInput = document.getElementById('layer-count-input');
    if (!layerCountInput) return;

    const newCount = parseInt(layerCountInput.value);
    if (newCount < 1 || newCount > 25) {
      alert('Ungültige Anzahl. Bitte zwischen 1-25 wählen.');
      return;
    }

    const currentCount = getLayerCount();
    if (newCount < currentCount) {
      const confirmed = confirm(
        `${currentCount - newCount} Schüler werden gelöscht. Alle ihre Edits gehen verloren. Fortfahren?`,
      );
      if (!confirmed) return;
    }

    updateLayerCount(newCount);
    updateStudentSelectDropdown();
    updateStudentManagerDisplay();
    updateStudentDropdown(getAllStudents());
    toggleStudentDropdownVisibility();

    console.log('[StudentUI] Layer count updated to:', newCount);
  };

  const tabContent =
    document.getElementById('students-content') ||
    document.querySelector('.overlay-tab-content');
  if (tabContent) {
    tabContent.addEventListener('click', (e) => {
      if (
        e.target.id === 'layer-count-update-btn' ||
        e.target.closest('#layer-count-update-btn')
      ) {
        handleUpdate();
      }
    });
  } else {
    const btn = document.getElementById('layer-count-update-btn');
    if (btn) btn.addEventListener('click', handleUpdate);
  }
}

/* ── student select ─────────────────────────────────────────────────────── */

function setupStudentSelect() {
  const studentSelectEdit = document.getElementById('student-select-edit');
  if (!studentSelectEdit) return;

  studentSelectEdit.addEventListener('change', async (e) => {
    const newIndex = parseInt(e.target.value);
    await handleStudentSwitch(newIndex);
    updateStudentManagerDisplay();
  });
}

/* ── student name save ──────────────────────────────────────────────────── */

function setupStudentNameSave() {
  const studentNameInput = document.getElementById('student-name-input');
  const studentNameSaveBtn = document.getElementById('student-name-save-btn');

  if (!studentNameSaveBtn || !studentNameInput) return;

  studentNameSaveBtn.addEventListener('click', () => {
    const newName = studentNameInput.value.trim();
    if (!newName) {
      alert('Bitte einen Namen eingeben.');
      return;
    }

    const index = getCurrentStudentIndex();
    updateStudentConfig(index, { name: newName });
    updateStudentSelectDropdown();
    updateStudentDropdown(getAllStudents());

    const useTitleCheckbox = document.getElementById('use-student-name-as-title');
    if (useTitleCheckbox && useTitleCheckbox.checked) {
      updateOverviewTitle(newName);
      saveIndexHTML().catch((err) => console.error('[StudentUI] Failed to save HTML:', err));
    }

    console.log('[StudentUI] Student name updated to:', newName);
  });
}

/* ── use-name-as-title checkbox ─────────────────────────────────────────── */

function setupUseTitleCheckbox() {
  const useTitleCheckbox = document.getElementById('use-student-name-as-title');
  if (!useTitleCheckbox) return;

  useTitleCheckbox.addEventListener('change', (e) => {
    const index = getCurrentStudentIndex();
    const student = getStudentConfig(index);
    updateStudentConfig(index, { useNameAsTitle: e.target.checked });

    if (e.target.checked && student) {
      updateOverviewTitle(student.name);
    } else {
      const contentData = getContentData();
      if (contentData && contentData.title) {
        updateOverviewTitle(contentData.title);
      }
    }

    saveIndexHTML().catch((err) => console.error('[StudentUI] Failed to save HTML:', err));
    console.log('[StudentUI] Use name as title toggled:', e.target.checked);
  });
}

/* ── student topic count ────────────────────────────────────────────────── */

function setupStudentTopicCount() {
  const input = document.getElementById('student-topic-count-input');
  const btn = document.getElementById('student-topic-count-save-btn');

  if (!btn || !input) return;

  btn.addEventListener('click', async () => {
    const newTopicCount = parseInt(input.value);
    if (newTopicCount < 3 || newTopicCount > 12) {
      alert('Ungültige Anzahl. Bitte zwischen 3-12 wählen.');
      return;
    }

    const index = getCurrentStudentIndex();
    updateStudentConfig(index, { topicCount: newTopicCount });
    await reloadPresentationForStudent();

    console.log('[StudentUI] Student topic count updated to:', newTopicCount);
  });
}

/* ── student delete ─────────────────────────────────────────────────────── */

function setupStudentDelete() {
  const studentDeleteBtn = document.getElementById('student-delete-btn');
  if (!studentDeleteBtn) return;

  studentDeleteBtn.addEventListener('click', () => {
    const index = getCurrentStudentIndex();
    const student = getStudentConfig(index);

    if (!student) {
      alert('Kein Schüler zum Löschen vorhanden.');
      return;
    }

    const confirmed = confirm(
      `Schüler "${student.name}" wirklich löschen? Alle Edits gehen verloren.`,
    );
    if (!confirmed) return;

    deleteStudent(index);
    updateStudentSelectDropdown();
    updateStudentManagerDisplay();
    updateStudentDropdown(getAllStudents());

    if (getLayerCount() === 0) {
      setLayerMode(false);
      document.getElementById('layer-mode-toggle').checked = false;
      document.getElementById('layer-controls').style.display = 'none';
      toggleStudentDropdownVisibility();
    }

    console.log('[StudentUI] Student deleted at index:', index);
  });
}

/* ── reload & PDF ───────────────────────────────────────────────────────── */

function setupReloadAndPdf() {
  const studentReloadBtn = document.getElementById('student-reload-btn');
  if (studentReloadBtn) {
    studentReloadBtn.addEventListener('click', async () => {
      await reloadPresentationForStudent();
    });
  }

  const pdfExportBtn = document.getElementById('pdf-export-btn');
  if (pdfExportBtn) {
    pdfExportBtn.addEventListener('click', () => {
      showPDFExportGuide();
    });
  }
}

/* ── dropdown / display helpers ─────────────────────────────────────────── */

function updateStudentSelectDropdown() {
  const studentSelectEdit = document.getElementById('student-select-edit');
  if (!studentSelectEdit) {
    console.warn('[StudentUI] Student select dropdown not found!');
    return;
  }

  const students = getAllStudents();
  const currentIndex = getCurrentStudentIndex();

  studentSelectEdit.innerHTML = '';

  students.forEach((student, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = student.name;
    studentSelectEdit.appendChild(option);
  });

  studentSelectEdit.value = currentIndex >= students.length ? 0 : currentIndex;
  updateStudentManagerDisplay();
}

function updateStudentManagerDisplay() {
  const student = getCurrentStudent();
  const studentNameInput = document.getElementById('student-name-input');
  const studentTopicCountInput = document.getElementById('student-topic-count-input');
  const useTitleCheckbox = document.getElementById('use-student-name-as-title');

  if (student) {
    if (studentNameInput) studentNameInput.value = student.name;
    if (studentTopicCountInput) studentTopicCountInput.value = student.topicCount;
    if (useTitleCheckbox) useTitleCheckbox.checked = student.useNameAsTitle || false;
  }

  // Refresh drag-drop list if layer mode is active
  if (isLayerModeEnabled() && getLayerCount() > 0) {
    import('./student-drag-drop.js')
      .then(({ renderStudentList }) => renderStudentList())
      .catch((error) => console.warn('[StudentUI] Error rendering student list:', error));
  }
}

/**
 * Update the overview slide title
 * @param {string} title
 */
function updateOverviewTitle(title) {
  const overviewTitle = document.querySelector('.overview-title');
  if (overviewTitle) {
    const lines = overviewTitle.innerHTML.split('<br>');
    lines[0] = title;
    overviewTitle.innerHTML = lines.join('<br>');
    console.log('[StudentUI] Overview title updated to:', title);
  }
}
