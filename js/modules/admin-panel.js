/**
 * ════════════════════════════════════════════════════════════════════════════
 * ADMIN PANEL
 * Menu administration: circle-title editing, slide generation, subtopic
 * CRUD with drag-drop reordering, child-node size slider, import/export,
 * and the quick-access "Circle Settings" modal.
 * ════════════════════════════════════════════════════════════════════════════
 */

import { refreshSubtopics } from './menu.js';
import {
  saveContent,
  saveIndexHTML,
  saveContentToServer,
  importContent,
  handleFileInputChange,
  getContentData,
  updateContentData,
} from './storage.js';
import { setTabContent } from './overlay.js';
import { normalizeSubtopic } from './utils/normalize.js';
import {
  generateCompleteSlidesHTML,
  saveGenerationMetadata,
  generateOverviewCircles,
} from './slide-generator.js';
import { showNotification } from './utils/notification.js';
import { setupSlideEditing } from './slide-editor.js';
import { STORAGE } from '../config/index.js';
import {
  isSharedCircleTitlesEnabled,
  setSharedCircleTitles,
  syncCircleTitlesToAllStudents,
  isLayerModeEnabled,
} from './student-manager.js';

/* ── module state ───────────────────────────────────────────────────────── */

let topicSelectEl = null;
let childListEl = null;
let addChildBtn = null;
let childEditorBound = false;
let dragSourceIndex = null;
let childSizeInput = null;
let childSizeValue = null;
let adminUICreated = false;

const MAX_SUBTOPICS = 6;

/* ── public API ─────────────────────────────────────────────────────────── */

/**
 * Placeholder – actual UI is created lazily in setupChildEditor / createAdminUI.
 */
export function setupAdminUI() {
  console.log('[AdminPanel] Setting up admin UI');
}

/**
 * Wire event listeners on admin control elements (slide generation, export/import).
 */
export function setupAdminControls() {
  console.log('[AdminPanel] Setting up admin controls...');

  const circleCountInput = document.getElementById('admin-circle-count');
  const generateBtn = document.getElementById('admin-generate-slides-btn');
  const refreshOverviewBtn = document.getElementById('admin-refresh-overview-btn');
  const circleCountDisplay = document.getElementById('circle-count-display');

  if (!generateBtn) {
    console.warn('[AdminPanel] Generate button not found! Checking DOM...');
    const allElements = document.querySelectorAll('[id^="admin-"]');
    console.log(
      '[AdminPanel] Admin elements in DOM:',
      Array.from(allElements).map((el) => el.id),
    );
  }

  if (circleCountInput) {
    circleCountInput.addEventListener('input', () => {
      const count = parseInt(circleCountInput.value, 10);
      if (count >= 3 && count <= 12 && circleCountDisplay) {
        circleCountDisplay.textContent = `${count} Kreise`;
      }
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const input = document.getElementById('admin-circle-count');
      const count = input ? parseInt(input.value, 10) : 10;
      handleGenerateSlides(count);
    });
  }

  if (refreshOverviewBtn) {
    refreshOverviewBtn.addEventListener('click', () => {
      const input = document.getElementById('admin-circle-count');
      const count = input ? parseInt(input.value, 10) : 10;
      handleRefreshOverview(count);
    });
  }

  // Export / Import
  const exportBtn = document.getElementById('export-content-btn');
  if (exportBtn) exportBtn.addEventListener('click', handleExport);

  const importBtn = document.getElementById('import-content-btn');
  if (importBtn) importBtn.addEventListener('click', handleImport);

  const fileInput = document.getElementById('import-file-input');
  if (fileInput) fileInput.addEventListener('change', handleFileInputChange);

  console.log('[AdminPanel] Admin controls setup');
}

/**
 * Initialise the child-editor (topic select + subtopic list).
 * Creates the admin UI HTML on first call.
 */
export function setupChildEditor() {
  topicSelectEl = document.getElementById('admin-topic-select');
  childListEl = document.getElementById('admin-child-list');
  addChildBtn = document.getElementById('admin-add-child-btn');
  childSizeInput = document.getElementById('admin-child-size');
  childSizeValue = document.getElementById('admin-child-size-value');

  const data = getContentData();

  // Create UI if not yet rendered
  if (!topicSelectEl && !adminUICreated && data && data.topics) {
    adminUICreated = true;
    createAdminUI();
    return;
  }

  if (!topicSelectEl || !data || !data.topics) {
    console.warn('[AdminPanel] Topic select element or data not found');
    return;
  }

  renderTopicOptions(data.topics);

  if (!childEditorBound) {
    topicSelectEl.addEventListener('change', () => {
      const topicId = parseInt(topicSelectEl.value, 10);
      renderChildList(topicId);
    });

    addChildBtn.addEventListener('click', () => {
      const topicId = parseInt(topicSelectEl.value, 10);
      addSubtopic(topicId);
    });

    childEditorBound = true;
  }

  const initialId = parseInt(topicSelectEl.value || data.topics[0]?.id, 10);
  if (!Number.isNaN(initialId)) {
    renderChildList(initialId);
  }
}

/**
 * Initialise the child-node size slider.
 */
export function setupSizeControls() {
  if (!childSizeInput || !childSizeValue) return;

  const rootStyles = getComputedStyle(document.documentElement);
  const idleSize = parseInt(rootStyles.getPropertyValue('--childnode-size-idle')) || 60;
  childSizeInput.value = idleSize;
  childSizeValue.textContent = `${idleSize}px`;

  childSizeInput.addEventListener('input', () => {
    const size = parseInt(childSizeInput.value, 10);
    applyChildSize(size);
  });
}

/**
 * Show the quick-access circle-settings modal (floating dialog).
 */
export function showCircleSettingsModal() {
  const existingModal = document.getElementById('circle-settings-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'circle-settings-modal';
  modal.className = 'modal-backdrop';

  const content = document.createElement('div');
  content.className = 'modal-content';

  content.innerHTML = `
    <h2 class="modal-title">🎯 Kreise einstellen</h2>
    
    <div class="admin-control-group">
      <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #555;">
        Anzahl Kreise / Topics:
      </label>
      <input
        id="modal-circle-count"
        type="number"
        min="3"
        max="12"
        value="10"
        style="width: 100%; padding: 10px; font-size: 16px; border: 2px solid #ddd; border-radius: 6px; box-sizing: border-box;"
      />
      <small class="form-hint-block">
        Wähle zwischen 3 und 12 Kreisen
      </small>
    </div>

    <div class="admin-control-group">
      <button id="modal-generate-btn" class="modal-btn modal-btn--generate">✨ Slides generieren</button>
      <button id="modal-refresh-btn" class="modal-btn modal-btn--refresh">🔄 Nur Kreise aktualisieren</button>
      <button id="modal-close-btn" class="modal-btn modal-btn--close">✕ Schließen</button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const circleInput = document.getElementById('modal-circle-count');
  const generateBtn = document.getElementById('modal-generate-btn');
  const refreshBtn = document.getElementById('modal-refresh-btn');
  const closeBtn = document.getElementById('modal-close-btn');

  circleInput.value = localStorage.getItem(STORAGE.circleCount) || '10';

  generateBtn.addEventListener('click', () => {
    const count = parseInt(circleInput.value, 10);
    if (count >= 3 && count <= 12) {
      handleGenerateSlides(count);
      modal.remove();
    } else {
      alert('Bitte gib eine Zahl zwischen 3 und 12 ein!');
    }
  });

  refreshBtn.addEventListener('click', () => {
    const count = parseInt(circleInput.value, 10);
    if (count >= 3 && count <= 12) {
      handleRefreshOverview(count);
      modal.remove();
    } else {
      alert('Bitte gib eine Zahl zwischen 3 und 12 ein!');
    }
  });

  closeBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  console.log('[AdminPanel] Circle settings modal opened');
}

/**
 * Setup circle navigation for dynamically generated slides.
 */
export function setupCircleNavigationFromEditMode() {
  const circles = document.querySelectorAll('.circle-item');
  if (!circles.length) {
    console.warn('[AdminPanel] No circle items found');
    return;
  }

  console.log('[AdminPanel] Setting up circle navigation for', circles.length, 'circles');

  circles.forEach((circle, index) => {
    circle.addEventListener('click', () => {
      const slideNum = index + 1;
      if (typeof Reveal !== 'undefined') {
        Reveal.slide(slideNum, 0);
      }
      console.log('[AdminPanel] Navigated to slide', slideNum, 'v=0 (group-intro)');
    });
  });
}

/**
 * Collect admin changes from DOM elements and persist to content data.
 */
export function collectAdminChanges() {
  const contentData = getContentData();
  if (!contentData) return;

  const titleElem = document.getElementById('presentation-title');
  const subtitleElem = document.getElementById('presentation-subtitle');
  const authorElem = document.getElementById('presentation-author');
  const closingElem = document.getElementById('closing-message');

  if (titleElem) contentData.title = titleElem.textContent;
  if (subtitleElem) contentData.subtitle = subtitleElem.textContent;
  if (authorElem) contentData.author = authorElem.textContent;
  if (closingElem) contentData.closingMessage = closingElem.textContent;

  updateContentData(contentData);
  console.log('[AdminPanel] Admin changes collected');
}

/* ── internal: admin UI creation ────────────────────────────────────────── */

function createAdminUI() {
  adminUICreated = true;

  const data = getContentData();
  let circleTitlesHTML = '';
  if (data && data.topics) {
    circleTitlesHTML = data.topics
      .map(
        (topic, idx) => `
      <div class="circle-title-row">
        <span class="circle-title-label">Kreis ${idx + 1}:</span>
        <input
          type="text"
          class="circle-title-input"
          data-topic-index="${idx}"
          data-topic-id="${topic.id}"
          value="${(topic.title || '').replace(/"/g, '&quot;')}"
          placeholder="Titel für Kreis ${idx + 1}"
        />
      </div>
    `,
      )
      .join('');
  } else {
    circleTitlesHTML =
      '<p class="text-muted">Keine Topics vorhanden. Bitte zuerst Slides generieren.</p>';
  }

  const adminHTML = `
    <div class="admin-panel">
      
      <!-- CIRCLE TITLES SECTION -->
      <div class="admin-section">
        <h3>🎯 Kreis-Titel bearbeiten</h3>
        <div class="admin-control-group">
          <div id="circle-titles-editor">
            ${circleTitlesHTML}
          </div>
          <button id="save-circle-titles-btn" class="admin-btn-primary mt-sm">
            💾 Kreis-Titel speichern
          </button>
          <small class="form-hint-block">
            Ändere die Titel der Kreise in der Übersichtsfolie und im Menü
          </small>
        </div>
        <div class="shared-titles-toggle mt-sm" ${!isLayerModeEnabled() ? 'style="display:none"' : ''}>
          <label class="shared-titles-label">
            <input type="checkbox" id="shared-circle-titles-checkbox"
                   ${isSharedCircleTitlesEnabled() ? 'checked' : ''}>
            <span>🔗 Gleiche Kreis-Titel für alle Schüler-Layer</span>
          </label>
          <small class="form-hint-block" style="margin-left: 24px;">
            Wenn aktiv, werden gespeicherte Kreis-Titel automatisch auf alle Schüler-Layer übertragen.
          </small>
        </div>
      </div>

      <!-- SLIDE GENERATION SECTION -->
      <div class="admin-section">
        <h3>📊 Slides generieren</h3>
        
        <div class="admin-control-group">
          <label for="admin-circle-count">Anzahl Kreise / Topics:</label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input id="admin-circle-count" type="number" min="3" max="12" value="10" style="width: 80px;" />
            <span id="circle-count-display" style="font-weight: bold; color: #0066cc;">10 Kreise</span>
          </div>
          <small class="form-hint-block">
            Generiert automatisch alle Slides, Detail-Slides und Navigationsboxen
          </small>
        </div>

        <div class="admin-control-group">
          <button id="admin-generate-slides-btn" class="admin-btn-generate">
            ✨ Slides generieren & einfügen
          </button>
          <button id="admin-refresh-overview-btn" class="admin-btn-secondary">
            🔄 Nur Übersicht aktualisieren
          </button>
        </div>
      </div>

      <!-- MENU ADMINISTRATION SECTION -->
      <div class="admin-section">
        <h3>📋 Menu verwalten</h3>
        
        <div class="admin-control-group">
          <label for="admin-topic-select">Topic auswählen:</label>
          <select id="admin-topic-select"></select>
        </div>

        <div class="admin-control-group">
          <label>Subtopics:</label>
          <div id="admin-child-list" class="admin-child-list"></div>
          <button id="admin-add-child-btn" class="admin-btn-add">+ Subtopic hinzufügen</button>
        </div>

        <div class="admin-control-group">
          <label for="admin-child-size">Childnode Größe:</label>
          <div style="display: flex; gap: 10px;">
            <input id="admin-child-size" type="range" min="40" max="150" value="60" style="flex: 1;" />
            <span id="admin-child-size-value" style="min-width: 100px;">60px</span>
          </div>
        </div>

        <div class="admin-control-group">
          <button id="export-content-btn" class="admin-btn-primary">📥 content.json exportieren</button>
          <button id="import-content-btn" class="admin-btn-primary">📤 content.json importieren</button>
          <small class="form-hint-block">
            Diese Buttons betreffen nur die JSON-Inhaltsdatei. "Kreis-Titel speichern" schreibt in index.html.
          </small>
        </div>
      </div>

      <input type="file" id="import-file-input" accept=".json" style="display: none;" />
    </div>
  `;

  setTabContent('menu-admin', adminHTML);

  setupCircleTitleEditor();

  // Re-assign element references
  topicSelectEl = document.getElementById('admin-topic-select');
  childListEl = document.getElementById('admin-child-list');
  addChildBtn = document.getElementById('admin-add-child-btn');
  childSizeInput = document.getElementById('admin-child-size');
  childSizeValue = document.getElementById('admin-child-size-value');

  // Recurse – elements exist now
  setupChildEditor();
  setupSizeControls();
}

/* ── circle title editor ────────────────────────────────────────────────── */

function setupCircleTitleEditor() {
  const saveBtn = document.getElementById('save-circle-titles-btn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.circle-title-input');
    const data = getContentData();

    if (!data || !data.topics) {
      showNotification('❌ Keine Content-Daten vorhanden!', 'error');
      return;
    }

    inputs.forEach((input) => {
      const newTitle = input.value.trim();
      if (!newTitle) return;

      const topicIndex = parseInt(input.dataset.topicIndex, 10);
      const topicId = input.dataset.topicId;

      let topic = null;
      if (!Number.isNaN(topicIndex) && data.topics[topicIndex]) {
        topic = data.topics[topicIndex];
      }

      if (!topic && typeof topicId !== 'undefined') {
        topic = data.topics.find((t) => String(t.id) === String(topicId));
      }

      if (topic) {
        topic.title = newTitle;
      }
    });

    updateContentData(data);

    // Update circles in the overview slide
    const circles = document.querySelectorAll('.circle-item');
    circles.forEach((circle, idx) => {
      const textEl = circle.querySelector('.circle-text');
      if (textEl && data.topics[idx]) {
        textEl.textContent = data.topics[idx].title;
      }
    });

    // Update menu tiles (mindmap) as well
    const menuTiles = document.querySelectorAll('.menu-tile');
    menuTiles.forEach((tile) => {
      const tileTopicId = tile.dataset.topicId;
      const topic = data.topics.find((t) => String(t.id) === String(tileTopicId));
      const titleEl = tile.querySelector('.tile-title');
      if (titleEl && topic) {
        titleEl.textContent = topic.title;
      }
    });

    renderTopicOptions(data.topics);

    // Sync titles to all student layers if shared titles is enabled
    if (isSharedCircleTitlesEnabled() && isLayerModeEnabled()) {
      const allTitles = data.topics.map((t) => t.title || '');
      syncCircleTitlesToAllStudents(allTitles);
      console.log('[AdminPanel] Circle titles synced to all students');
    }

    Promise.all([saveIndexHTML(), saveContentToServer(data)])
      .then(([htmlSaved, jsonSaved]) => {
        if (htmlSaved && jsonSaved) {
          showNotification('✅ Kreis-Titel gespeichert (index.html + content.json)!', 'success');
        } else if (htmlSaved || jsonSaved) {
          showNotification('⚠️ Teilweise gespeichert (bitte Save-Server prüfen)', 'warning');
        } else {
          showNotification('⚠️ Titel aktualisiert (Speichern fehlgeschlagen)', 'warning');
        }
      })
      .catch((err) => {
        console.error('[AdminPanel] Error saving circle titles:', err);
        showNotification('⚠️ Titel aktualisiert (Speichern fehlgeschlagen)', 'warning');
      });

    console.log('[AdminPanel] Circle titles updated');
  });

  // Wire shared-circle-titles checkbox
  setupSharedCircleTitlesCheckbox();
}

/**
 * Wire the "Gleiche Kreis-Titel" checkbox events.
 */
function setupSharedCircleTitlesCheckbox() {
  const checkbox = document.getElementById('shared-circle-titles-checkbox');
  if (!checkbox) return;

  checkbox.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    setSharedCircleTitles(enabled);

    if (enabled && isLayerModeEnabled()) {
      // Immediately sync current titles to all students
      const data = getContentData();
      if (data && data.topics) {
        const allTitles = data.topics.map((t) => t.title || '');
        syncCircleTitlesToAllStudents(allTitles);
        showNotification('🔗 Kreis-Titel werden jetzt für alle Schüler synchronisiert.', 'success');
      }
    } else if (!enabled) {
      showNotification('🔓 Kreis-Titel sind jetzt individuell pro Schüler.', 'info');
    }
  });
}

/* ── child-node size ────────────────────────────────────────────────────── */

function applyChildSize(sizePx) {
  const root = document.documentElement;
  const focusSize = Math.round(sizePx * 1.6);
  root.style.setProperty('--childnode-size-idle', `${sizePx}px`);
  root.style.setProperty('--childnode-size-focus', `${focusSize}px`);
  if (childSizeValue) childSizeValue.textContent = `${sizePx}px / ${focusSize}px`;

  refreshSubtopicsAll();
}

/* ── topic select / child list ──────────────────────────────────────────── */

function renderTopicOptions(topics) {
  if (!topicSelectEl) return;
  topicSelectEl.innerHTML = '';

  topics.forEach((topic) => {
    const option = document.createElement('option');
    option.value = topic.id;
    option.textContent = topic.title || `Thema ${topic.id}`;
    topicSelectEl.appendChild(option);
  });
}

function renderChildList(topicId) {
  if (!childListEl) return;
  const data = getContentData();
  const topic = data?.topics?.find((t) => t.id === topicId);

  childListEl.innerHTML = '';
  if (!topic) return;

  const subtopics = Array.isArray(topic.subtopics)
    ? topic.subtopics.map(normalizeSubtopic)
    : [];
  topic.subtopics = subtopics;

  subtopics.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'admin-child-row';
    row.dataset.index = index;
    row.draggable = true;

    const handle = document.createElement('span');
    handle.className = 'admin-drag-handle';
    handle.textContent = '⋮⋮';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = entry.title;
    input.placeholder = 'Subtopic';
    input.addEventListener('input', () => updateSubtopicValue(topicId, index, input.value));

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'admin-remove-child';
    removeBtn.textContent = 'Entfernen';
    removeBtn.addEventListener('click', () => removeSubtopic(topicId, index));

    row.addEventListener('dragstart', (e) => startDrag(e, index));
    row.addEventListener('dragover', (e) => onDragOver(e));
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
    row.addEventListener('drop', (e) => onDrop(e, topicId, index));

    row.appendChild(handle);
    row.appendChild(input);
    row.appendChild(removeBtn);
    childListEl.appendChild(row);
  });

  updateAddButtonState(subtopics.length);
}

function updateAddButtonState(count) {
  if (!addChildBtn) return;
  addChildBtn.disabled = count >= MAX_SUBTOPICS;
}

/* ── subtopic CRUD ──────────────────────────────────────────────────────── */

function addSubtopic(topicId) {
  const data = getContentData();
  if (!data?.topics) return;

  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
  if (topic.subtopics.length >= MAX_SUBTOPICS) return;

  topic.subtopics.push({ title: 'Neues Subtopic', position: null });
  updateContentData(data);
  renderChildList(topicId);
  refreshSubtopics(topicId);
}

function removeSubtopic(topicId, index) {
  const data = getContentData();
  if (!data?.topics) return;

  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic || !Array.isArray(topic.subtopics)) return;

  topic.subtopics.splice(index, 1);
  updateContentData(data);
  renderChildList(topicId);
  refreshSubtopics(topicId);
}

function updateSubtopicValue(topicId, childIndex, value) {
  const data = getContentData();
  if (!data?.topics) return;

  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
  const existing = normalizeSubtopic(topic.subtopics[childIndex]);
  topic.subtopics[childIndex] = { ...existing, title: value };

  updateContentData(data);
  refreshSubtopics(topicId);
}

function reorderSubtopics(topicId, fromIndex, toIndex) {
  const data = getContentData();
  if (!data?.topics) return;

  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic || !Array.isArray(topic.subtopics)) return;
  topic.subtopics = topic.subtopics.map(normalizeSubtopic);

  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= topic.subtopics.length ||
    toIndex >= topic.subtopics.length
  ) {
    return;
  }

  const [moved] = topic.subtopics.splice(fromIndex, 1);
  topic.subtopics.splice(toIndex, 0, moved);

  updateContentData(data);
  renderChildList(topicId);
  refreshSubtopics(topicId);
}

/* ── drag handlers ──────────────────────────────────────────────────────── */

function startDrag(event, index) {
  dragSourceIndex = index;
  event.dataTransfer.effectAllowed = 'move';
}

function onDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function onDrop(event, topicId, targetIndex) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (dragSourceIndex === null) return;
  reorderSubtopics(topicId, dragSourceIndex, targetIndex);
  dragSourceIndex = null;
}

/* ── slide generation ───────────────────────────────────────────────────── */

function handleGenerateSlides(circleCount) {
  if (typeof circleCount !== 'number' || isNaN(circleCount)) {
    const input =
      document.getElementById('admin-circle-count') ||
      document.getElementById('modal-circle-count');
    circleCount = input ? parseInt(input.value, 10) : 10;
  }
  if (circleCount < 3 || circleCount > 12) {
    showNotification('❌ Anzahl muss zwischen 3 und 12 liegen!', 'error');
    return;
  }

  console.log('[AdminPanel] Generating', circleCount, 'slides...');

  try {
    const newSlidesHTML = generateCompleteSlidesHTML(
      circleCount,
      'Neue Präsentation',
      'Automatisch generiert',
      'Autor',
    );

    const slidesContainer = document.querySelector('.reveal .slides');
    if (!slidesContainer) {
      showNotification('❌ Slides Container nicht gefunden!', 'error');
      return;
    }

    slidesContainer.innerHTML = newSlidesHTML;

    saveGenerationMetadata(circleCount, {
      title: 'Neue Präsentation',
      subtitle: 'Automatisch generiert',
      author: 'Autor',
    });

    if (typeof Reveal !== 'undefined') {
      Reveal.sync();
      console.log('[AdminPanel] Reveal.js synced');
    }

    setTimeout(() => {
      setupSlideEditing();
      setupCircleNavigationFromEditMode();
      if (window.setupNavigationBoxes) {
        window.setupNavigationBoxes();
      }
      showNotification(`✨ ${circleCount} Slides generiert und eingefügt!`, 'success');
    }, 500);
  } catch (error) {
    console.error('[AdminPanel] Generation error:', error);
    showNotification('❌ Fehler beim Generieren der Slides: ' + error.message, 'error');
  }
}

function handleRefreshOverview(circleCount) {
  if (typeof circleCount !== 'number' || isNaN(circleCount)) {
    const input =
      document.getElementById('admin-circle-count') ||
      document.getElementById('modal-circle-count');
    circleCount = input ? parseInt(input.value, 10) : 10;
  }
  if (circleCount < 3 || circleCount > 12) {
    showNotification('❌ Anzahl muss zwischen 3 und 12 liegen!', 'error');
    return;
  }

  try {
    const overviewSection = document.querySelector('#overview .spiral-container');
    if (!overviewSection) {
      showNotification('❌ Overview Sektion nicht gefunden!', 'error');
      return;
    }

    let circleContainer = overviewSection.querySelector('.circles-container');
    if (!circleContainer) {
      const titleElem = overviewSection.querySelector('.overview-title');
      if (titleElem) {
        circleContainer = document.createElement('div');
        circleContainer.className = 'circles-container';
        overviewSection.insertBefore(circleContainer, titleElem.nextSibling);
      }
    }

    if (!circleContainer) {
      showNotification('❌ Circle Container nicht gefunden!', 'error');
      return;
    }

    overviewSection.querySelectorAll('.circle-item').forEach((el) => el.remove());
    circleContainer.innerHTML = generateOverviewCircles(circleCount);

    localStorage.setItem(STORAGE.circleCount, circleCount.toString());

    showNotification(`🔄 Übersicht mit ${circleCount} Kreisen aktualisiert!`, 'success');
    console.log('[AdminPanel] Overview refreshed with', circleCount, 'circles');
  } catch (error) {
    console.error('[AdminPanel] Overview refresh error:', error);
    showNotification('❌ Fehler beim Aktualisieren der Übersicht!', 'error');
  }
}

/* ── export / import handlers ───────────────────────────────────────────── */

async function handleExport() {
  collectAdminChanges();
  await saveContent();
}

async function handleImport() {
  await importContent();
}

function refreshSubtopicsAll() {
  const data = getContentData();
  if (data?.topics) {
    data.topics.forEach((topic) => refreshSubtopics(topic.id));
  }
}
