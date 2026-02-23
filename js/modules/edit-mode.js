/**
 * ════════════════════════════════════════════════════════════════════════════
 * EDIT MODE – ORCHESTRATOR
 * Thin entry-point that wires together the extracted feature modules:
 *   slide-editor.js   – inline editing & nav-box sync
 *   export-html.js    – Ctrl+S HTML export via save_server
 *   admin-panel.js    – menu admin, circle titles, slide generation
 *   student-ui.js     – student / layer-mode management UI
 *
 * Activated by ?mode=edit URL parameter, Ctrl+E shortcut,
 * or the floating ✏️ button (always visible in presentation).
 * ════════════════════════════════════════════════════════════════════════════
 */

import { setEditMode } from './menu.js';
import { showOverlay, hideOverlay, switchTab } from './overlay.js';
import { setupSlideEditing, populateSlideEditTab } from './slide-editor.js';
import {
  setupAdminUI,
  setupAdminControls,
  setupChildEditor,
  setupSizeControls,
  showCircleSettingsModal,
  collectAdminChanges,
} from './admin-panel.js';
import { setupStudentManagerUI } from './student-ui.js';
import { showNotification } from './utils/notification.js';

/* ── module state ───────────────────────────────────────────────────────── */

let editModeActive = false;
let floatingBtn = null;
let saveServerAvailable = false;

/* ── public API ─────────────────────────────────────────────────────────── */

/**
 * Initialise Edit Mode if ?mode=edit is in URL.
 * Also registers the Ctrl+E keyboard shortcut and creates the floating button.
 */
export function initEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  // Create the floating edit toggle (always visible)
  createFloatingEditButton();

  // Support legacy ?mode=admin redirect
  if (mode === 'edit' || mode === 'admin') {
    activateEditMode();
  }

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'e') {
      event.preventDefault();
      toggleEditMode();
    }
  });

  // Probe the save endpoint in the background
  checkSaveServer();

  console.log('[EditMode] Module initialized');
}

/**
 * Toggle Edit Mode on / off.
 */
export function toggleEditMode() {
  if (editModeActive) {
    deactivateEditMode();
  } else {
    activateEditMode();
  }
}

/**
 * Check whether Edit Mode is currently active.
 */
export function isEditModeActive() {
  return editModeActive;
}

/**
 * Re-export so other modules can navigate circles after generation.
 */
export { setupCircleNavigationFromEditMode } from './admin-panel.js';

/* ── activate / deactivate ──────────────────────────────────────────────── */

function activateEditMode() {
  if (editModeActive) return;

  editModeActive = true;
  console.log('[EditMode] Edit mode activated');
  document.body.classList.add('edit-mode');

  // Warn if save server is not reachable
  if (!saveServerAvailable) {
    checkSaveServer().then(() => {
      if (!saveServerAvailable) {
        showNotification(
          '⚠️ Speichern nicht verfügbar – bitte mit python server.py starten.',
          'warning',
        );
      }
    });
  }

  // Update floating button state
  updateFloatingButton();

  // ── slide editing ────────────────────────────────────────────────────
  if (typeof Reveal !== 'undefined' && Reveal.isReady && Reveal.isReady()) {
    setupSlideEditing();
  } else if (typeof Reveal !== 'undefined' && Reveal.on) {
    Reveal.on('ready', () => setupSlideEditing());
  } else {
    setTimeout(setupSlideEditing, 1000);
  }

  // ── admin features ───────────────────────────────────────────────────
  setupAdminUI();

  try {
    setupStudentManagerUI();
  } catch (error) {
    console.warn('[EditMode] Error setting up student manager UI:', error);
  }

  showOverlay('Bearbeitungsmodus');

  // Create admin elements first, then wire listeners
  setupChildEditor();
  setupSizeControls();
  setupAdminControls();

  // Populate the slide-edit tab with all editable content
  populateSlideEditTab();

  switchTab('slide-edit');
  setEditMode(true);

  console.log('[EditMode] All features activated');
}

function deactivateEditMode() {
  if (!editModeActive) return;

  editModeActive = false;
  console.log('[EditMode] Edit mode deactivated');
  document.body.classList.remove('edit-mode');

  // Disable inline editing
  document.querySelectorAll('[contenteditable="true"]').forEach((el) => {
    el.contentEditable = 'false';
    el.classList.remove('editable-field');
  });

  setEditMode(false);
  hideOverlay();
  collectAdminChanges();

  // Update floating button state
  updateFloatingButton();

  console.log('[EditMode] All features deactivated');
}

/* ── edit-mode toggle switch ─────────────────────────────────────────────── */

/**
 * Create a persistent checkbox-style toggle switch that lets users
 * switch between Presentation mode and Edit mode.
 */
function createFloatingEditButton() {
  if (floatingBtn) return;

  floatingBtn = document.createElement('label');
  floatingBtn.className = 'edit-mode-switch';
  floatingBtn.setAttribute('title', 'Edit-Mode umschalten (Ctrl+E)');
  floatingBtn.innerHTML = `
    <input type="checkbox" id="edit-mode-checkbox">
    <span class="edit-switch-track"></span>
    <span class="edit-switch-label">Edit-Mode</span>
  `;

  const checkbox = floatingBtn.querySelector('#edit-mode-checkbox');
  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();
    toggleEditMode();
  });

  // Prevent Reveal.js from intercepting clicks
  floatingBtn.addEventListener('click', (e) => e.stopPropagation());

  document.body.appendChild(floatingBtn);
  updateFloatingButton();
}

/**
 * Sync checkbox state with current edit mode.
 */
function updateFloatingButton() {
  if (!floatingBtn) return;

  const checkbox = floatingBtn.querySelector('#edit-mode-checkbox');
  if (checkbox) {
    checkbox.checked = editModeActive;
  }
}

/* ── save-server health check ───────────────────────────────────────────── */

/**
 * Probe the /health endpoint to check whether saving is available.
 * Shows a one-time warning if the save endpoint is unreachable.
 */
async function checkSaveServer() {
  try {
    const res = await fetch('/health', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      saveServerAvailable = data.saveEnabled === true;
      console.log('[EditMode] Save server available:', saveServerAvailable);
    } else {
      saveServerAvailable = false;
    }
  } catch {
    saveServerAvailable = false;
    console.warn(
      '[EditMode] Save endpoint not reachable. ' +
      'Starte den Server mit: python server.py',
    );
  }
}

/**
 * Returns whether the save server has been detected as available.
 */
export function isSaveServerAvailable() {
  return saveServerAvailable;
}