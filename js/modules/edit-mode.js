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
  saveIndexHTML,
} from './storage.js';
import {
  showOverlay,
  hideOverlay,
  switchTab,
  setTabContent,
  appendToTabContent,
  clearTabContent,
  isOverlayVisible,
} from '../../src/ui/overlay.js';
import { normalizeSubtopic } from './utils/normalize.js';
import {
  generateCompleteSlidesHTML,
  saveGenerationMetadata,
  loadGenerationMetadata,
} from './slide-generator.js';
import {
  isLayerModeEnabled,
  setLayerMode,
  getLayerCount,
  createStudentConfigs,
  updateLayerCount,
  getCurrentStudent,
  getCurrentStudentIndex,
  getStudentConfig,
  updateStudentConfig,
  deleteStudent,
  getAllStudents,
} from './student-manager.js';
import {
  initStudentLayerController,
  handleStudentSwitch,
  reloadPresentationForStudent,
  updateStudentDropdown,
  toggleStudentDropdownVisibility,
} from './student-layer-controller.js';
import { showPDFExportGuide } from './pdf-export.js';

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
let adminUICreated = false; // Flag to prevent infinite loop

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

  // Add Circle Settings Button (nur im Edit-Mode sichtbar)
  const circleSettingsBtn = document.createElement('button');
  circleSettingsBtn.className = 'circle-settings-btn-edit-mode';
  circleSettingsBtn.innerHTML = '⚙️ Kreise einstellen';
  circleSettingsBtn.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 9998;
    box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
  `;
  
  circleSettingsBtn.addEventListener('mouseover', () => {
    circleSettingsBtn.style.transform = 'translateY(-2px)';
    circleSettingsBtn.style.boxShadow = '0 6px 20px rgba(245, 87, 108, 0.6)';
  });
  
  circleSettingsBtn.addEventListener('mouseout', () => {
    circleSettingsBtn.style.transform = 'translateY(0)';
    circleSettingsBtn.style.boxShadow = '0 4px 12px rgba(245, 87, 108, 0.4)';
  });
  
  circleSettingsBtn.addEventListener('click', () => {
    showCircleSettingsModal();
  });
  
  document.body.appendChild(circleSettingsBtn);

  // Add Schüler Manager Button (unterhalb Kreise einstellen)
  const schuelerManagerBtn = document.createElement('button');
  schuelerManagerBtn.className = 'schueler-manager-btn-edit-mode';
  schuelerManagerBtn.innerHTML = '👥 Schüler verwalten';
  schuelerManagerBtn.style.cssText = `
    position: fixed;
    bottom: 50px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 9998;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
  `;
  
  schuelerManagerBtn.addEventListener('mouseover', () => {
    schuelerManagerBtn.style.transform = 'translateY(-2px)';
    schuelerManagerBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });
  
  schuelerManagerBtn.addEventListener('mouseout', () => {
    schuelerManagerBtn.style.transform = 'translateY(0)';
    schuelerManagerBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });
  
  schuelerManagerBtn.addEventListener('click', () => {
    showOverlay('Bearbeitungsmodus');
    switchTab('students');
  });
  
  document.body.appendChild(schuelerManagerBtn);

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
  
  // Initialize Student Manager UI (mit Error Handling)
  try {
    setupStudentManagerUI();
  } catch (error) {
    console.warn('[EditMode] Error setting up student manager UI:', error);
  }

  // Show unified overlay with tabs
  showOverlay('Bearbeitungsmodus');
  
  // Setup admin UI FIRST so elements are created
  setupChildEditor();
  setupSizeControls();
  
  // THEN setup controls (after elements exist)
  setupAdminControls();
  
  // Switch to Menu verwalten tab to show admin panel
  switchTab('menu-admin');

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

  // Remove Circle Settings Button
  const circleSettingsBtn = document.querySelector('.circle-settings-btn-edit-mode');
  if (circleSettingsBtn) {
    circleSettingsBtn.remove();
  }

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

  document.querySelectorAll('.overview-subtitle').forEach((el) => {
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
 * STUDENT MANAGER UI
 * ===================================
 */
function setupStudentManagerUI() {
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
  
  // Initialisiere Drag-Drop (mit Error Handling)
  try {
    import('./student-drag-drop.js').then(({ initStudentDragDrop, renderStudentList }) => {
      if (isLayerModeEnabled() && getLayerCount() > 0) {
        renderStudentList();
        initStudentDragDrop();
      }
    }).catch(error => {
      console.warn('[EditMode] Error loading student drag-drop module:', error);
    });
  } catch (error) {
    console.warn('[EditMode] Error initializing drag-drop:', error);
  }
}

/**
 * Setzt Event-Listener für Student Manager UI
 */
function setupStudentManagerListeners() {
  try {
    // Layer-Mode Toggle
    const layerModeToggle = document.getElementById('layer-mode-toggle');
    const layerControls = document.getElementById('layer-controls');
    
    if (layerModeToggle && layerControls) {
      // Set initial display state based on current layer mode
      layerControls.style.display = isLayerModeEnabled() ? 'block' : 'none';
      
      layerModeToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        
        setLayerMode(isEnabled);
        layerControls.style.display = isEnabled ? 'block' : 'none';
        toggleStudentDropdownVisibility();
        
        // Wenn aktiviert: erstelle 0 Schüler (Nutzer kann dann die Anzahl wählen)
        if (isEnabled && getLayerCount() === 0) {
          // Initial state - Nutzer wählt Anzahl
          const layerCountInput = document.getElementById('layer-count-input');
          if (layerCountInput) {
            layerCountInput.value = 0;
          }
        }
      });
    }
    
    // Deactivate Layer Mode Button - Use Event Delegation
    try {
      const tabContent = document.querySelector('.tab-content');
      if (tabContent) {
        tabContent.addEventListener('click', (e) => {
          if (e.target.id === 'deactivate-layer-mode-btn' || e.target.closest('#deactivate-layer-mode-btn')) {
            const deactivateBtn = document.getElementById('deactivate-layer-mode-btn');
            const layerControls = document.getElementById('layer-controls');
            const layerModeToggle = document.getElementById('layer-mode-toggle');
            
            const confirmed = confirm(
              '⚠️ WARNUNG: Layer-Modus deaktivieren?\n\n' +
              'Dies wird ALLE ' + getLayerCount() + ' Schüler und ihre Daten (Markierungen, Lesezeichen, Notizen) löschen!\n\n' +
              'Diese Aktion kann nicht rückgängig gemacht werden.\n\n' +
              'Möchten Sie fortfahren?'
            );
            
            if (confirmed) {
              setLayerMode(false);
              if (layerControls) layerControls.style.display = 'none';
              if (layerModeToggle) layerModeToggle.checked = false;
              toggleStudentDropdownVisibility();
              showNotification('Layer-Modus deaktiviert. Alle Schülerdaten wurden gelöscht.', 'success');
            }
          }
        });
      }
    } catch (buttonError) {
      console.error('[EditMode] Error setting up deactivate button:', buttonError);
    }
    
    console.log('[EditMode] All student manager listeners setup complete');
  } catch (error) {
    console.error('[EditMode] Error in setupStudentManagerListeners:', error);
  }
  
  // Layer Count Update - Use Event Delegation
  const tabContent = document.querySelector('.tab-content');
  if (tabContent) {
    tabContent.addEventListener('click', (e) => {
      if (e.target.id === 'layer-count-update-btn' || e.target.closest('#layer-count-update-btn')) {
        console.log('[EditMode] Layer count update button clicked');
        const layerCountInput = document.getElementById('layer-count-input');
        if (!layerCountInput) return;
        
        const newCount = parseInt(layerCountInput.value);
        
        if (newCount < 1 || newCount > 25) {
          alert('Ungültige Anzahl. Bitte zwischen 1-25 wählen.');
          return;
        }
        
        const currentCount = getLayerCount();
        
        if (newCount < currentCount) {
          // Warnung bei Reduktion
          const confirmed = confirm(
            `${currentCount - newCount} Schüler werden gelöscht. Alle ihre Edits gehen verloren. Fortfahren?`
          );
          if (!confirmed) return;
        }
        
        updateLayerCount(newCount);
        createStudentConfigs(newCount, true);
        
        // Aktualisiere UI
        updateStudentSelectDropdown();
        updateStudentManagerDisplay();
        updateStudentDropdown(getAllStudents());
        toggleStudentDropdownVisibility();
        
        console.log('[EditMode] Layer count updated to:', newCount);
      }
    });
  } else {
    // Fallback if tab-content not found - attach directly
    const layerCountUpdateBtn = document.getElementById('layer-count-update-btn');
    const layerCountInput = document.getElementById('layer-count-input');
    
    if (layerCountUpdateBtn && layerCountInput) {
      layerCountUpdateBtn.addEventListener('click', () => {
        const newCount = parseInt(layerCountInput.value);
        
        if (newCount < 1 || newCount > 25) {
          alert('Ungültige Anzahl. Bitte zwischen 1-25 wählen.');
          return;
        }
        
        const currentCount = getLayerCount();
        
        if (newCount < currentCount) {
          // Warnung bei Reduktion
          const confirmed = confirm(
            `${currentCount - newCount} Schüler werden gelöscht. Alle ihre Edits gehen verloren. Fortfahren?`
          );
          if (!confirmed) return;
        }
        
        updateLayerCount(newCount);
        createStudentConfigs(newCount, true);
        
        // Aktualisiere UI
        updateStudentSelectDropdown();
        updateStudentManagerDisplay();
        updateStudentDropdown(getAllStudents());
        toggleStudentDropdownVisibility();
        
        console.log('[EditMode] Layer count updated to:', newCount);
      });
    }
  }
  
  // Student Select Dropdown
  const studentSelectEdit = document.getElementById('student-select-edit');
  if (studentSelectEdit) {
    studentSelectEdit.addEventListener('change', async (e) => {
      const newIndex = parseInt(e.target.value);
      await handleStudentSwitch(newIndex);
      updateStudentManagerDisplay();
    });
  }
  
  // Student Name Save
  const studentNameInput = document.getElementById('student-name-input');
  const studentNameSaveBtn = document.getElementById('student-name-save-btn');
  
  if (studentNameSaveBtn && studentNameInput) {
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
      
      // Update title if option is enabled
      const useTitleCheckbox = document.getElementById('use-student-name-as-title');
      if (useTitleCheckbox && useTitleCheckbox.checked) {
        updateOverviewTitle(newName);
        // Save HTML to server
        saveIndexHTML().catch(err => console.error('[EditMode] Failed to save HTML:', err));
      }
      
      console.log('[EditMode] Student name updated to:', newName);
    });
  }
  
  // Use Student Name as Title Checkbox
  const useTitleCheckbox = document.getElementById('use-student-name-as-title');
  if (useTitleCheckbox) {
    useTitleCheckbox.addEventListener('change', (e) => {
      const index = getCurrentStudentIndex();
      const student = getStudentConfig(index);
      updateStudentConfig(index, { useNameAsTitle: e.target.checked });
      
      if (e.target.checked && student) {
        updateOverviewTitle(student.name);
      } else {
        // Restore original title
        const contentData = getContentData();
        if (contentData && contentData.title) {
          updateOverviewTitle(contentData.title);
        }
      }
      
      // Save HTML to server
      saveIndexHTML().catch(err => console.error('[EditMode] Failed to save HTML:', err));
      
      console.log('[EditMode] Use name as title toggled:', e.target.checked);
    });
  }
  
  // Student Topic Count Save
  const studentTopicCountInput = document.getElementById('student-topic-count-input');
  const studentTopicCountSaveBtn = document.getElementById('student-topic-count-save-btn');
  
  if (studentTopicCountSaveBtn && studentTopicCountInput) {
    studentTopicCountSaveBtn.addEventListener('click', async () => {
      const newTopicCount = parseInt(studentTopicCountInput.value);
      
      if (newTopicCount < 3 || newTopicCount > 12) {
        alert('Ungültige Anzahl. Bitte zwischen 3-12 wählen.');
        return;
      }
      
      const index = getCurrentStudentIndex();
      updateStudentConfig(index, { topicCount: newTopicCount });
      await reloadPresentationForStudent();
      
      console.log('[EditMode] Student topic count updated to:', newTopicCount);
    });
  }
  
  // Student Delete
  const studentDeleteBtn = document.getElementById('student-delete-btn');
  if (studentDeleteBtn) {
    studentDeleteBtn.addEventListener('click', () => {
      const index = getCurrentStudentIndex();
      const student = getStudentConfig(index);
      
      if (!student) {
        alert('Kein Schüler zum Löschen vorhanden.');
        return;
      }
      
      const confirmed = confirm(
        `Schüler "${student.name}" wirklich löschen? Alle Edits gehen verloren.`
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
      
      console.log('[EditMode] Student deleted at index:', index);
    });
  }
  
  // Presentation Reload
  const studentReloadBtn = document.getElementById('student-reload-btn');
  if (studentReloadBtn) {
    studentReloadBtn.addEventListener('click', async () => {
      await reloadPresentationForStudent();
    });
  }
  
  // PDF Export
  const pdfExportBtn = document.getElementById('pdf-export-btn');
  if (pdfExportBtn) {
    pdfExportBtn.addEventListener('click', () => {
      showPDFExportGuide();
    });
  }
}

/**
 * Aktualisiert Student-Select-Dropdown
 */
function updateStudentSelectDropdown() {
  const studentSelectEdit = document.getElementById('student-select-edit');
  const studentNameInput = document.getElementById('student-name-input');
  const studentTopicCountInput = document.getElementById('student-topic-count-input');
  
  if (!studentSelectEdit) {
    console.warn('[EditMode] Student select dropdown not found!');
    return;
  }
  
  const students = getAllStudents();
  const currentIndex = getCurrentStudentIndex();
  
  // Leere Dropdown
  studentSelectEdit.innerHTML = '';
  
  // Füge Optionen hinzu
  students.forEach((student, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = student.name;
    studentSelectEdit.appendChild(option);
  });
  
  // Setze aktuellen Index
  studentSelectEdit.value = currentIndex >= students.length ? 0 : currentIndex;
  
  // Aktualisiere Eingabefelder
  updateStudentManagerDisplay();
}

/**
 * Aktualisiert Student-Manager-Anzeige mit aktuellen Daten
 */
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
  
  // Aktualisiere Drag-Drop-Liste, falls Layer-Modus aktiv (asynchron)
  if (isLayerModeEnabled() && getLayerCount() > 0) {
    import('./student-drag-drop.js').then(({ renderStudentList }) => {
      renderStudentList();
    }).catch(error => {
      console.warn('[EditMode] Error rendering student list:', error);
    });
  }
}

/**
 * Aktualisiert den Titel der Übersichtsfolie
 * @param {string} title - Neuer Titel
 */
function updateOverviewTitle(title) {
  const overviewTitle = document.querySelector('.overview-title');
  if (overviewTitle) {
    // Behalte den Untertitel, falls vorhanden
    const lines = overviewTitle.innerHTML.split('<br>');
    lines[0] = title;
    overviewTitle.innerHTML = lines.join('<br>');
    console.log('[EditMode] Overview title updated to:', title);
  }
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
  console.log('[EditMode] Setting up admin controls...');
  
  // Slide Generation Controls
  const circleCountInput = document.getElementById('admin-circle-count');
  const generateBtn = document.getElementById('admin-generate-slides-btn');
  const refreshOverviewBtn = document.getElementById('admin-refresh-overview-btn');
  const circleCountDisplay = document.getElementById('circle-count-display');

  console.log('[EditMode] Found elements:', {
    circleCountInput: !!circleCountInput,
    generateBtn: !!generateBtn,
    refreshOverviewBtn: !!refreshOverviewBtn,
    circleCountDisplay: !!circleCountDisplay
  });

  if (!generateBtn) {
    console.warn('[EditMode] Generate button not found! Checking DOM...');
    const allElements = document.querySelectorAll('[id^="admin-"]');
    console.log('[EditMode] Admin elements in DOM:', Array.from(allElements).map(el => el.id));
  }

  if (circleCountInput) {
    circleCountInput.addEventListener('input', () => {
      const count = parseInt(circleCountInput.value, 10);
      if (count >= 3 && count <= 12) {
        if (circleCountDisplay) {
          circleCountDisplay.textContent = `${count} Kreise`;
        }
      }
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerateSlides);
  }

  if (refreshOverviewBtn) {
    refreshOverviewBtn.addEventListener('click', handleRefreshOverview);
  }

  // Menu Management Controls
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
 * Setup Child Editor UI
 */
function setupChildEditor() {
  topicSelectEl = document.getElementById('admin-topic-select');
  childListEl = document.getElementById('admin-child-list');
  addChildBtn = document.getElementById('admin-add-child-btn');
  childSizeInput = document.getElementById('admin-child-size');
  childSizeValue = document.getElementById('admin-child-size-value');

  const data = getContentData();

  // Only create UI if not already created and elements don't exist
  if (!topicSelectEl && !adminUICreated && data && data.topics) {
    adminUICreated = true; // Set flag BEFORE creating to prevent infinite loop
    createAdminUI();
    return;
  }

  if (!topicSelectEl || !data || !data.topics) {
    console.warn('[EditMode] Topic select element or data not found');
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
  adminUICreated = true;
  
  const adminHTML = `
    <div class="admin-panel">
      
      <!-- SLIDE GENERATION SECTION -->
      <div class="admin-section">
        <h3>📊 Slides generieren</h3>
        
        <div class="admin-control-group">
          <label for="admin-circle-count">Anzahl Kreise / Topics:</label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input
              id="admin-circle-count"
              type="number"
              min="3"
              max="12"
              value="10"
              style="width: 80px;"
            />
            <span id="circle-count-display" style="font-weight: bold; color: #0066cc;">10 Kreise</span>
          </div>
          <small style="display: block; margin-top: 5px; color: #666;">
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
 * Show simple circle settings modal
 */
function showCircleSettingsModal() {
  // Remove existing modal if present
  const existingModal = document.getElementById('circle-settings-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'circle-settings-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 99998;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
  `;

  content.innerHTML = `
    <h2 style="margin-top: 0; color: #333;">🎯 Kreise einstellen</h2>
    
    <div style="margin: 20px 0;">
      <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #555;">
        Anzahl Kreise / Topics:
      </label>
      <input
        id="modal-circle-count"
        type="number"
        min="3"
        max="12"
        value="10"
        style="
          width: 100%;
          padding: 10px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 6px;
          box-sizing: border-box;
        "
      />
      <small style="display: block; margin-top: 8px; color: #888;">
        Wähle zwischen 3 und 12 Kreisen
      </small>
    </div>

    <div style="margin: 20px 0;">
      <button id="modal-generate-btn" style="
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 10px;
      ">
        ✨ Slides generieren
      </button>
      
      <button id="modal-refresh-btn" style="
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 10px;
      ">
        🔄 Nur Kreise aktualisieren
      </button>

      <button id="modal-close-btn" style="
        width: 100%;
        padding: 12px;
        background: #ddd;
        color: #333;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        ✕ Schließen
      </button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Event handlers
  const circleInput = document.getElementById('modal-circle-count');
  const generateBtn = document.getElementById('modal-generate-btn');
  const refreshBtn = document.getElementById('modal-refresh-btn');
  const closeBtn = document.getElementById('modal-close-btn');

  circleInput.value = localStorage.getItem('overview-circle-count') || '10';

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

  closeBtn.addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  console.log('[EditMode] Circle settings modal opened');
}

/**
 * ===================================
 * SLIDE GENERATION HANDLERS
 * ===================================
 */

/**
 * Generate and insert new slides
 */
function handleGenerateSlides(circleCount) {
  if (circleCount < 3 || circleCount > 12) {
    showNotification('❌ Anzahl muss zwischen 3 und 12 liegen!', 'error');
    return;
  }

  console.log('[EditMode] Generating', circleCount, 'slides...');

  try {
    // Generate HTML
    const newSlidesHTML = generateCompleteSlidesHTML(
      circleCount,
      'Neue Präsentation',
      'Automatisch generiert',
      'Autor'
    );

    // Find and replace slides container
    const slidesContainer = document.querySelector('.reveal .slides');
    if (!slidesContainer) {
      showNotification('❌ Slides Container nicht gefunden!', 'error');
      return;
    }

    // Replace slides
    slidesContainer.innerHTML = newSlidesHTML;

    // Save metadata
    saveGenerationMetadata(circleCount, {
      title: 'Neue Präsentation',
      subtitle: 'Automatisch generiert',
      author: 'Autor'
    });

    // Reinitialize Reveal.js
    if (typeof Reveal !== 'undefined') {
      Reveal.sync();
      console.log('[EditMode] Reveal.js synced');
    }

    // Re-setup slide editing for new slides
    setTimeout(() => {
      setupSlideEditing();
      setupCircleNavigationFromEditMode();
      // Re-setup navigation boxes for new slides (called from presentation.js)
      if (window.setupNavigationBoxes) {
        window.setupNavigationBoxes();
      }
      showNotification(`✨ ${circleCount} Slides generiert und eingefügt!`, 'success');
    }, 500);

  } catch (error) {
    console.error('[EditMode] Generation error:', error);
    showNotification('❌ Fehler beim Generieren der Slides: ' + error.message, 'error');
  }
}

/**
 * Refresh only the overview circle arrangement
 */
function handleRefreshOverview(circleCount) {
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

    // Find the container for circles
    let circleContainer = overviewSection.querySelector('.circles-container');
    if (!circleContainer) {
      // Create if doesn't exist
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

    // Remove old circles
    overviewSection.querySelectorAll('.circle-item').forEach(el => el.remove());

    // Insert new circles
    circleContainer.innerHTML = generateOverviewCircles(circleCount);

    // Save count
    localStorage.setItem('overview-circle-count', circleCount.toString());

    showNotification(`🔄 Übersicht mit ${circleCount} Kreisen aktualisiert!`, 'success');
    console.log('[EditMode] Overview refreshed with', circleCount, 'circles');

  } catch (error) {
    console.error('[EditMode] Overview refresh error:', error);
    showNotification('❌ Fehler beim Aktualisieren der Übersicht!', 'error');
  }
}

/**
 * Setup circle navigation for dynamically generated slides (called from handleGenerateSlides)
 * Note: presentation.js already has setupCircleNavigation, we use local version there
 */
export function setupCircleNavigationFromEditMode() {
  const circles = document.querySelectorAll('.circle-item');
  if (!circles.length) {
    console.warn('[EditMode] No circle items found');
    return;
  }

  console.log('[EditMode] Setting up circle navigation for', circles.length, 'circles');

  circles.forEach((circle, index) => {
    circle.addEventListener('click', () => {
      const slideNum = index + 1;
      if (typeof Reveal !== 'undefined') {
        Reveal.slide(slideNum, 0); // Navigate to group-intro (v=0) - die Hauptslide
      }
      console.log('[EditMode] Navigated to slide', slideNum, 'v=0 (group-intro)');
    });
  });
}

/**
 * ===================================
 * MENU ADMINISTRATION HANDLERS
 * ===================================
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
