/**
 * ════════════════════════════════════════════════════════════════════════════
 * UNIFIED EDIT MODE
 * Combines Slide Editing and Menu Administration in one mode
 * Activated by ?mode=edit URL parameter
 * ════════════════════════════════════════════════════════════════════════════
 */

import { setEditMode, refreshSubtopics } from './menu.js';
import {
  saveContent,
  importContent,
  handleFileInputChange,
  getContentData,
  updateContentData,
  getSlideEdits,
  saveSlideEdits,
} from './storage.js';
import {
  showOverlay,
  hideOverlay,
  switchTab,
  setTabContent,
  appendToTabContent,
  clearTabContent,
} from '../ui/overlay.js';
import { normalizeSubtopic } from './utils/normalize.js';

let editModeActive = false;
let currentEditingSlide = null;

// Admin-specific state
let topicSelectEl = null;
let childListEl = null;
let addChildBtn = null;
let childEditorBound = false;
let dragSourceIndex = null;
let childSizeInput = null;
let childSizeValue = null;

const MAX_SUBTOPICS = 6;

/**
 * Initialize Edit Mode if ?mode=edit is in URL
 * Handles both Slide Editing and Menu Administration
 */
export function initEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  // Support legacy ?mode=admin and redirect to ?mode=edit
  if (mode === 'edit' || mode === 'admin') {
    activateEditMode();
  }

  // Keyboard Shortcut: Ctrl+E to toggle Edit Mode
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'e') {
      event.preventDefault();
      toggleEditMode();
    }
  });

  console.log('[EditMode] Module initialized');
}

/**
 * Activate Edit Mode (both Slide Editing and Menu Admin)
 */
function activateEditMode() {
  if (editModeActive) return;

  editModeActive = true;
  console.log('[EditMode] Edit mode activated');
  document.body.classList.add('edit-mode');

  // Initialize Editor Features
  if (typeof Reveal !== 'undefined' && Reveal.isReady) {
    setupSlideEditing();
  } else if (typeof Reveal !== 'undefined' && Reveal.on) {
    Reveal.on('ready', () => {
      setupSlideEditing();
    });
  } else {
    setTimeout(setupSlideEditing, 1000);
  }

  // Initialize Admin Features
  setupAdminUI();

  // Show unified overlay with tabs
  showOverlay('Bearbeitungsmodus');
  setupAdminControls();
  setupChildEditor();
  setupSizeControls();

  // Activate menu edit mode
  setEditMode(true);

  console.log('[EditMode] All features activated');
}

/**
 * Deactivate Edit Mode
 */
function deactivateEditMode() {
  if (!editModeActive) return;

  editModeActive = false;
  console.log('[EditMode] Edit mode deactivated');
  document.body.classList.remove('edit-mode');

  // Disable inline editing
  document.querySelectorAll('[contenteditable="true"]').forEach((el) => {
    el.contentEditable = 'false';
    el.classList.remove('editable-field');
    el.style.outline = '';
    el.style.outlineOffset = '';
  });

  // Disable menu edit mode
  setEditMode(false);

  // Hide overlay
  hideOverlay();

  // Collect and save changes
  collectAdminChanges();

  console.log('[EditMode] All features deactivated');
}

/**
 * Toggle Edit Mode on/off
 */
export function toggleEditMode() {
  if (editModeActive) {
    deactivateEditMode();
  } else {
    activateEditMode();
  }
}

/**
 * Check if Edit Mode is active
 */
export function isEditModeActive() {
  return editModeActive;
}

/**
 * ===================================
 * SLIDE EDITING FEATURES
 * ===================================
 */

function setupSlideEditing() {
  console.log('[EditMode] Setting up slide editing');

  // Validate slide structure
  validateSlideStructure();

  // Enable inline editing
  enableInlineEditing();

  // Apply stored edits
  applyStoredEdits();

  // Setup slide change listener
  if (typeof Reveal !== 'undefined') {
    Reveal.on('slidechanged', () => {
      setTimeout(() => {
        enableInlineEditing();
      }, 100);
    });
  }

  // Setup Ctrl+S to export
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      exportHTML();
    }
  });

  // Show hint
  const hint = document.createElement('div');
  hint.className = 'editor-hint';
  hint.innerHTML = '📝 Edit Mode | Ctrl+S to export | Ctrl+E for admin';
  hint.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(52, 152, 219, 0.9);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 9998;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  `;
  document.body.appendChild(hint);

  console.log('[EditMode] Slide editing setup complete');
}

/**
 * Validate slide structure
 */
function validateSlideStructure() {
  console.log('[EditMode] Validating slide structure...');

  const detailSlides = document.querySelectorAll('.detail-slide');
  let valid = 0;
  let warnings = 0;

  detailSlides.forEach((slide) => {
    const parentTopic = slide.dataset.parentTopic;
    const section = slide.closest('section.stack');

    if (!section) {
      console.warn('[EditMode] Detail slide without parent section:', slide);
      warnings++;
      return;
    }

    const topicId = section.dataset.topicId;

    if (!parentTopic || !topicId || parentTopic !== topicId) {
      console.warn('[EditMode] Topic mismatch:', slide);
      warnings++;
      return;
    }

    valid++;
  });

  console.log(
    `[EditMode] Validation: ${valid} valid, ${warnings} warnings`
  );
}

/**
 * Enable inline editing for editable elements
 */
function enableInlineEditing() {
  document.querySelectorAll('.overview-title').forEach((el) => {
    makeEditable(el);
  });

  document.querySelectorAll('.group-intro .group-subtitle').forEach((el) => {
    makeEditable(el);
  });

  document.querySelectorAll('.detail-slide').forEach((slide) => {
    const title = slide.querySelector(
      ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6'
    );
    if (title) makeEditable(title);

    const paragraphs = slide.querySelectorAll(':scope > p');
    paragraphs.forEach((p) => makeEditable(p));

    const textDivs = slide.querySelectorAll(':scope > div');
    textDivs.forEach((div) => {
      if (div.querySelector('button')) return;
      if (!div.textContent || !div.textContent.trim()) return;
      makeEditable(div);
    });
  });

  document.querySelectorAll('.nav-box h4, .nav-box p').forEach((el) => {
    makeEditable(el);
  });

  console.log('[EditMode] Inline editing enabled');
}

/**
 * Make element editable with visual indicators
 */
function makeEditable(element) {
  if (element.contentEditable === 'true') return;

  element.contentEditable = 'true';
  element.classList.add('editable-field');

  element.style.outline = '2px dashed rgba(52, 152, 219, 0.3)';
  element.style.outlineOffset = '4px';
  element.style.transition = 'outline 0.2s';

  element.addEventListener('focus', () => {
    element.style.outline = '2px solid rgba(52, 152, 219, 0.8)';
  });

  element.addEventListener('blur', () => {
    element.style.outline = '2px dashed rgba(52, 152, 219, 0.3)';
    saveElementContent(element);
  });

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && element.tagName !== 'P') {
      e.preventDefault();
      element.blur();
    }
  });
}

/**
 * Save element content to storage
 */
function saveElementContent(element) {
  const content = element.innerHTML;
  const identifier = getElementIdentifier(element);

  if (!identifier) return;

  const edits = getSlideEdits();
  edits[identifier] = content;
  saveSlideEdits(edits);

  console.log(`[EditMode] Saved: ${identifier}`);

  // Sync detail-slide changes to nav-box
  syncDetailToNavBox(element);

  showNotification('Changes saved!', 'success');
}

/**
 * Sync detail-slide content to nav-box
 */
function syncDetailToNavBox(element) {
  const detailSlide = element.closest('.detail-slide');
  if (!detailSlide) return;

  const parentTopic = detailSlide.dataset.parentTopic;
  const section = detailSlide.closest('section.stack');
  if (!section) return;

  let hIndex;
  if (detailSlide.dataset.indexH) {
    hIndex = parseInt(detailSlide.dataset.indexH, 10);
  } else if (typeof Reveal !== 'undefined') {
    try {
      hIndex = Reveal.getIndices().h;
    } catch {}
  }
  if (typeof hIndex !== 'number') {
    const allSections = document.querySelectorAll('.reveal .slides > section');
    hIndex = Array.from(allSections).indexOf(section);
  }

  let vIndex;
  if (detailSlide.dataset.indexV) {
    vIndex = parseInt(detailSlide.dataset.indexV, 10);
  } else if (typeof Reveal !== 'undefined' && detailSlide.classList.contains('present')) {
    try {
      vIndex = Reveal.getIndices().v;
    } catch {}
  }
  if (typeof vIndex !== 'number') {
    const vCandidates = Array.from(section.children).filter(
      (n) => n.tagName === 'SECTION'
    );
    vIndex = vCandidates.indexOf(detailSlide);
  }

  const navBox = document.querySelector(
    `.nav-box[data-target-h="${hIndex}"][data-target-v="${vIndex}"]`
  );
  if (!navBox) return;

  const fragment = document.createDocumentFragment();

  const detailTitle = detailSlide.querySelector('h3, h5');
  if (detailTitle) {
    const navTitle = document.createElement('h4');
    navTitle.className = detailTitle.className || '';
    navTitle.textContent = detailTitle.textContent;
    fragment.appendChild(navTitle);
  }

  const directPs = Array.from(detailSlide.children).filter(
    (n) => n.tagName === 'P'
  );

  directPs.forEach((p) => {
    const text = p.textContent.trim();
    if (!text) return;
    const newP = document.createElement('p');
    newP.className = p.className || '';
    newP.textContent = text;
    fragment.appendChild(newP);
  });

  if (navBox.classList.contains('expanded')) {
    const tmp = document.createElement('div');
    tmp.appendChild(fragment.cloneNode(true));
    navBox.dataset.originalContent = tmp.innerHTML;
  } else {
    navBox.innerHTML = '';
    navBox.appendChild(fragment);
  }

  console.log('[EditMode] Synced detail-slide to nav-box');
}

/**
 * Get unique element identifier
 */
function getElementIdentifier(element) {
  const slide = element.closest('section');
  if (!slide) return null;

  const allSlides = document.querySelectorAll('.reveal .slides section');
  const slideIndex = Array.from(allSlides).indexOf(slide);

  const tagName = element.tagName.toLowerCase();
  const className = element.className.replace(/\s+/g, '_');
  const siblings = slide.querySelectorAll(
    tagName + '.' + element.className.split(' ')[0]
  );
  const elementIndex = Array.from(siblings).indexOf(element);

  return `slide_${slideIndex}_${tagName}_${className}_${elementIndex}`;
}

/**
 * Apply stored edits on load
 */
function applyStoredEdits() {
  const edits = getSlideEdits();

  Object.keys(edits).forEach((identifier) => {
    const content = edits[identifier];
    const element = findElementByIdentifier(identifier);

    if (element && content && !element.closest('.nav-box')) {
      element.innerHTML = content;
    }
  });

  console.log(`[EditMode] Applied ${Object.keys(edits).length} stored edits`);

  try {
    resyncAllNavBoxesFromDetailSlides();
  } catch (e) {
    console.warn('[EditMode] Resync failed:', e);
  }
}

/**
 * Find element by identifier
 */
function findElementByIdentifier(identifier) {
  const parts = identifier.split('_');
  if (parts[0] !== 'slide') return null;

  const slideIndex = parseInt(parts[1]);
  const tagName = parts[2];
  const className = parts[3];
  const elementIndex = parseInt(parts[4]);

  const slide = document.querySelectorAll('.reveal .slides section')[slideIndex];
  if (!slide) return null;

  const elements = slide.querySelectorAll(
    tagName + '.' + className.split('_')[0]
  );
  return elements[elementIndex];
}

/**
 * Resync all nav boxes from detail slides
 */
function resyncAllNavBoxesFromDetailSlides() {
  const detailSlides = document.querySelectorAll('.detail-slide');
  let synced = 0;
  detailSlides.forEach((slide) => {
    syncDetailToNavBox(slide);
    synced++;
  });
  console.log(`[EditMode] Resynced ${synced} nav boxes`);
}

/**
 * Export edited HTML
 */
function exportHTML() {
  const clone = document.documentElement.cloneNode(true);

  cleanupRevealRuntime(clone);

  clone
    .querySelectorAll(
      '.editor-controls, .edit-slide-btn, .editor-modal, .editor-hint'
    )
    .forEach((el) => el.remove());
  clone
    .querySelectorAll('.notification-toast, .nav-box-overlay')
    .forEach((el) => el.remove());

  clone.querySelectorAll('[contenteditable]').forEach((el) => {
    el.removeAttribute('contenteditable');
    el.classList.remove('editable-field');
    el.style.outline = '';
    el.style.outlineOffset = '';
  });

  try {
    purgeMsOfficeMarkup(clone);
  } catch (e) {
    console.warn('[EditMode] Sanitizer failed:', e);
  }

  const body = clone.querySelector('body');
  if (body) {
    body.classList.remove('edit-mode');
  }

  const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;

  fetch('http://localhost:8001/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html: htmlContent }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('[EditMode] Server response:', data);
      showNotification(
        '✅ Saved to index.html! Reload to see changes.',
        'success'
      );
    })
    .catch((error) => {
      console.error('[EditMode] Save error:', error);
      showNotification('❌ Save failed! Is save_server.py running?', 'error');
    });
}

/**
 * Purge MS Office markup
 */
function purgeMsOfficeMarkup(root) {
  root.querySelectorAll('o\\:p').forEach((el) => el.remove());

  root.querySelectorAll('[style]').forEach((el) => {
    const styleAttr = el.getAttribute('style');
    if (!styleAttr) return;
    const cleaned = styleAttr
      .split(';')
      .map((s) => s.trim())
      .filter(
        (s) =>
          s &&
          !/^mso-/i.test((s.split(':')[0] || '').trim())
      )
      .join('; ');
    if (cleaned) el.setAttribute('style', cleaned);
    else el.removeAttribute('style');
  });

  root.querySelectorAll('.MsoNormal').forEach((el) => {
    el.classList.remove('MsoNormal');
    if (!el.className) el.removeAttribute('class');
  });

  let nested;
  while ((nested = root.querySelector('p p'))) {
    const parent = nested.parentElement;
    while (nested.firstChild)
      parent.insertBefore(nested.firstChild, nested);
    nested.remove();
  }

  root.querySelectorAll('p').forEach((p) => {
    const onlyWhitespace =
      !p.textContent || !p.textContent.trim();
    if (onlyWhitespace && p.children.length === 0) p.remove();
  });
}

/**
 * Cleanup Reveal runtime
 */
function cleanupRevealRuntime(root) {
  const reveal = root.querySelector('.reveal');
  if (!reveal) return;

  reveal
    .querySelectorAll(
      '.backgrounds, .progress, .controls, .slide-number, .speaker-notes, .pause-overlay, .aria-status'
    )
    .forEach((el) => el.remove());

  reveal.removeAttribute('style');
  const slides = reveal.querySelector('.slides');
  if (slides) {
    slides.removeAttribute('style');
    slides.querySelectorAll('section').forEach((sec) => {
      sec.removeAttribute('style');
      sec.removeAttribute('data-index-h');
      sec.removeAttribute('data-index-v');
      sec.removeAttribute('data-previous-indexv');
    });
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notif = document.createElement('div');
  notif.className = 'notification-toast';
  if (type === 'error') notif.classList.add('error');

  notif.innerHTML = `
    <span class="icon">${type === 'error' ? '❌' : '✅'}</span>
    <span class="message">${message}</span>
  `;

  document.body.appendChild(notif);

  setTimeout(() => notif.remove(), 3000);
}

/**
 * ===================================
 * MENU ADMINISTRATION FEATURES
 * ===================================
 */

function setupAdminUI() {
  console.log('[EditMode] Setting up admin UI');

  // Admin content will be built in setupChildEditor
}

/**
 * Setup Admin Control event listeners
 */
function setupAdminControls() {
  const exportBtn = document.getElementById('export-content-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExport);
  }

  const importBtn = document.getElementById('import-content-btn');
  if (importBtn) {
    importBtn.addEventListener('click', handleImport);
  }

  const fileInput = document.getElementById('import-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileInputChange);
  }

  console.log('[EditMode] Admin controls setup');
}

/**
 * Normalize subtopic entry
 */
function normalizeSubtopic(entry) {
  if (typeof entry === 'string')
    return { title: entry, position: null };
  if (entry && typeof entry === 'object') {
    return {
      title: entry.title ?? '',
      position: entry.position ?? null,
    };
  }
  return { title: '', position: null };
}

/**
 * Setup Child Editor UI
 */
function setupChildEditor() {
  topicSelectEl = document.getElementById('admin-topic-select');
  childListEl = document.getElementById('admin-child-list');
  addChildBtn = document.getElementById('admin-add-child-btn');
  childSizeInput = document.getElementById('admin-child-size');
  childSizeValue = document.getElementById('admin-child-size-value');

  const data = getContentData();

  if (!topicSelectEl || !data || !data.topics) {
    // Create UI if doesn't exist
    createAdminUI();
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

  const initialId = parseInt(
    topicSelectEl.value || data.topics[0]?.id,
    10
  );
  if (!Number.isNaN(initialId)) {
    renderChildList(initialId);
  }
}

/**
 * Create Admin UI HTML
 */
function createAdminUI() {
  const adminHTML = `
    <div class="admin-panel">
      <div class="admin-section">
        <h3>Menu verwalten</h3>
        
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
            <input
              id="admin-child-size"
              type="range"
              min="40"
              max="150"
              value="60"
              style="flex: 1;"
            />
            <span id="admin-child-size-value" style="min-width: 100px;">60px</span>
          </div>
        </div>

        <div class="admin-control-group">
          <button id="export-content-btn" class="admin-btn-primary">📥 Exportieren</button>
          <button id="import-content-btn" class="admin-btn-primary">📤 Importieren</button>
        </div>
      </div>

      <input
        type="file"
        id="import-file-input"
        accept=".json"
        style="display: none;"
      />
    </div>
  `;

  setTabContent('menu-admin', adminHTML);

  // Re-assign element references
  topicSelectEl = document.getElementById('admin-topic-select');
  childListEl = document.getElementById('admin-child-list');
  addChildBtn = document.getElementById('admin-add-child-btn');
  childSizeInput = document.getElementById('admin-child-size');
  childSizeValue = document.getElementById('admin-child-size-value');

  // Now setup with the new elements
  setupChildEditor();
  setupSizeControls();
}

/**
 * Setup size controls
 */
function setupSizeControls() {
  if (!childSizeInput || !childSizeValue) return;

  const rootStyles = getComputedStyle(document.documentElement);
  const idleSize =
    parseInt(rootStyles.getPropertyValue('--childnode-size-idle')) || 60;
  childSizeInput.value = idleSize;
  childSizeValue.textContent = `${idleSize}px`;

  childSizeInput.addEventListener('input', () => {
    const size = parseInt(childSizeInput.value, 10);
    applyChildSize(size);
  });
}

/**
 * Apply child size
 */
function applyChildSize(sizePx) {
  const root = document.documentElement;
  const focusSize = Math.round(sizePx * 1.6);
  root.style.setProperty('--childnode-size-idle', `${sizePx}px`);
  root.style.setProperty('--childnode-size-focus', `${focusSize}px`);
  if (childSizeValue)
    childSizeValue.textContent = `${sizePx}px / ${focusSize}px`;

  refreshSubtopicsAll();
}

/**
 * Render topic select options
 */
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

/**
 * Render child list
 */
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
    input.addEventListener('input', () =>
      updateSubtopicValue(topicId, index, input.value)
    );

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'admin-remove-child';
    removeBtn.textContent = 'Entfernen';
    removeBtn.addEventListener('click', () =>
      removeSubtopic(topicId, index)
    );

    row.addEventListener('dragstart', (e) => startDrag(e, index));
    row.addEventListener('dragover', (e) => onDragOver(e));
    row.addEventListener('dragleave', () =>
      row.classList.remove('drag-over')
    );
    row.addEventListener('drop', (e) => onDrop(e, topicId, index));

    row.appendChild(handle);
    row.appendChild(input);
    row.appendChild(removeBtn);
    childListEl.appendChild(row);
  });

  updateAddButtonState(subtopics.length);
}

/**
 * Update add button state
 */
function updateAddButtonState(count) {
  if (!addChildBtn) return;
  addChildBtn.disabled = count >= MAX_SUBTOPICS;
}

/**
 * Add subtopic
 */
function addSubtopic(topicId) {
  const data = getContentData();
  if (!data?.topics) return;

  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.subtopics = Array.isArray(topic.subtopics)
    ? topic.subtopics
    : [];
  if (topic.subtopics.length >= MAX_SUBTOPICS) return;

  topic.subtopics.push({ title: 'Neues Subtopic', position: null });
  updateContentData(data);
  renderChildList(topicId);
  refreshSubtopics(topicId);
}

/**
 * Reorder subtopics
 */
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

/**
 * Drag handlers
 */
function startDrag(event, index) {
  dragSourceIndex = index;
  event.dataTransfer.effectAllowed = 'move';
}

function onDragOver(event) {
  event.preventDefault();
  const row = event.currentTarget;
  row.classList.add('drag-over');
}

function onDrop(event, topicId, targetIndex) {
  event.preventDefault();
  const row = event.currentTarget;
  row.classList.remove('drag-over');
  if (dragSourceIndex === null) return;
  reorderSubtopics(topicId, dragSourceIndex, targetIndex);
  dragSourceIndex = null;
}

/**
 * Remove subtopic
 */
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

/**
 * Update subtopic value
 */
function updateSubtopicValue(topicId, childIndex, value) {
  const data = getContentData();
  if (!data?.topics) return;

  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.subtopics = Array.isArray(topic.subtopics)
    ? topic.subtopics
    : [];
  const existing = normalizeSubtopic(topic.subtopics[childIndex]);
  topic.subtopics[childIndex] = { ...existing, title: value };

  updateContentData(data);
  refreshSubtopics(topicId);
}

/**
 * Collect admin changes
 */
function collectAdminChanges() {
  const contentData = getContentData();
  if (!contentData) return;

  // Update main data from elements if they exist
  const titleElem = document.getElementById('presentation-title');
  const subtitleElem = document.getElementById('presentation-subtitle');
  const authorElem = document.getElementById('presentation-author');
  const closingElem = document.getElementById('closing-message');

  if (titleElem) contentData.title = titleElem.textContent;
  if (subtitleElem) contentData.subtitle = subtitleElem.textContent;
  if (authorElem) contentData.author = authorElem.textContent;
  if (closingElem) contentData.closingMessage = closingElem.textContent;

  updateContentData(contentData);
  console.log('[EditMode] Admin changes collected');
}

/**
 * Handle export
 */
async function handleExport() {
  collectAdminChanges();
  await saveContent();
}

/**
 * Handle import
 */
async function handleImport() {
  await importContent();
}

/**
 * Refresh subtopics all
 */
function refreshSubtopicsAll() {
  const data = getContentData();
  if (data?.topics) {
    data.topics.forEach((topic) => {
      refreshSubtopics(topic.id);
    });
  }
}
