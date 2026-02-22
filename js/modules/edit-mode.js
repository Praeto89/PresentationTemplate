/**
 * ════════════════════════════════════════════════════════════════════════════
 * EDIT MODE – ORCHESTRATOR
 * Thin entry-point that wires together the extracted feature modules:
 *   slide-editor.js   – inline editing & nav-box sync
 *   export-html.js    – Ctrl+S HTML export via save_server
 *   admin-panel.js    – menu admin, circle titles, slide generation
 *   student-ui.js     – student / layer-mode management UI
 *
 * Activated by ?mode=edit URL parameter or Ctrl+E shortcut.
 * ════════════════════════════════════════════════════════════════════════════
 */

import { setEditMode } from './menu.js';
import { showOverlay, hideOverlay, switchTab } from './overlay.js';
import { setupSlideEditing } from './slide-editor.js';
import {
  setupAdminUI,
  setupAdminControls,
  setupChildEditor,
  setupSizeControls,
  showCircleSettingsModal,
  collectAdminChanges,
} from './admin-panel.js';
import { setupStudentManagerUI } from './student-ui.js';

/* ── module state ───────────────────────────────────────────────────────── */

let editModeActive = false;

/* ── public API ─────────────────────────────────────────────────────────── */

/**
 * Initialise Edit Mode if ?mode=edit is in URL.
 * Also registers the Ctrl+E keyboard shortcut.
 */
export function initEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

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

  // ── floating buttons (only visible in edit mode) ─────────────────────
  createFloatingButton({
    className: 'floating-action-btn--circles',
    label: '⚙️ Kreise einstellen',
    onClick: () => showCircleSettingsModal(),
  });

  createFloatingButton({
    className: 'floating-action-btn--students',
    label: '👥 Schüler verwalten',
    onClick: () => {
      showOverlay('Bearbeitungsmodus');
      switchTab('students');
    },
  });

  // ── slide editing ────────────────────────────────────────────────────
  if (typeof Reveal !== 'undefined' && Reveal.isReady) {
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

  switchTab('menu-admin');
  setEditMode(true);

  console.log('[EditMode] All features activated');
}

function deactivateEditMode() {
  if (!editModeActive) return;

  editModeActive = false;
  console.log('[EditMode] Edit mode deactivated');
  document.body.classList.remove('edit-mode');

  // Remove floating buttons
  document.querySelector('.floating-action-btn--circles')?.remove();
  document.querySelector('.floating-action-btn--students')?.remove();

  // Disable inline editing
  document.querySelectorAll('[contenteditable="true"]').forEach((el) => {
    el.contentEditable = 'false';
    el.classList.remove('editable-field');
  });

  setEditMode(false);
  hideOverlay();
  collectAdminChanges();

  console.log('[EditMode] All features deactivated');
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

/**
 * Create a fixed-position floating action button.
 * @param {object} opts
 */
function createFloatingButton({ className, label, onClick }) {
  const btn = document.createElement('button');
  btn.className = `floating-action-btn ${className}`;
  btn.innerHTML = label;

  btn.addEventListener('click', onClick);
  document.body.appendChild(btn);
}
