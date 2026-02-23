/**
 * Unified Overlay System for Edit-Mode
 * Handles both Slide Editing and Menu Administration with tabbed interface
 */

let overlayElement = null;
let currentActiveTab = null;

/**
 * Initialize or get overlay element
 */
function getOrCreateOverlay() {
  if (overlayElement) return overlayElement;
  
  const existingOverlays = document.querySelectorAll('.edit-overlay');
  if (existingOverlays.length > 0) {
    existingOverlays.forEach((el) => el.remove());
  }

  overlayElement = document.createElement('div');
  overlayElement.className = 'edit-overlay is-hidden';
  overlayElement.style.zIndex = '99999';
  overlayElement.style.position = 'fixed';
  overlayElement.innerHTML = `
    <div class="overlay-content">
      <div class="overlay-header">
        <h2 class="overlay-title">Bearbeitungsmodus</h2>
        <button class="overlay-close-btn" aria-label="Overlay schließen">✕</button>
      </div>
      <div class="overlay-tabs">
        <button class="tab-button" data-tab="slide-edit" aria-selected="true">Slides bearbeiten</button>
        <button class="tab-button" data-tab="students" aria-selected="false">Schüler</button>
        <button class="tab-button" data-tab="menu-admin" aria-selected="false">Menu verwalten</button>
      </div>
      <div class="overlay-tab-content">
        <div class="tab-pane" id="slide-edit-content" data-tab="slide-edit"></div>
        <div class="tab-pane" id="students-content" data-tab="students" style="display: none;"></div>
        <div class="tab-pane" id="menu-admin-content" data-tab="menu-admin" style="display: none;"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlayElement);
  
  // Setup event listeners
  overlayElement.querySelector('.overlay-close-btn').addEventListener('click', hideOverlay);
  
  // Tab switching
  overlayElement.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Keep overlay open on backdrop clicks to avoid accidental closes
  overlayElement.addEventListener('click', (e) => {
    if (e.target === overlayElement && e.currentTarget === overlayElement) {
      e.stopPropagation();
    }
  });

  // Prevent keyboard events inside the overlay from reaching Reveal.js
  overlayElement.addEventListener('keydown', (e) => {
    // Allow Ctrl+S (export shortcut) to pass through
    if ((e.ctrlKey || e.metaKey) && e.key === 's') return;
    // Block everything else from bubbling to Reveal / custom handlers
    e.stopPropagation();
  });
  
  return overlayElement;
}

/**
 * Show overlay with optional title
 */
export function showOverlay(title = 'Bearbeitungsmodus') {
  const overlay = getOrCreateOverlay();
  overlay.querySelector('.overlay-title').textContent = title;
  overlay.classList.remove('is-hidden');
}

/**
 * Hide overlay
 */
export function hideOverlay() {
  if (overlayElement) {
    overlayElement.classList.add('is-hidden');
  }
}

/**
 * Check if overlay is visible
 */
export function isOverlayVisible() {
  return overlayElement && !overlayElement.classList.contains('is-hidden');
}

/**
 * Switch to specific tab
 */
export function switchTab(tabName) {
  const overlay = getOrCreateOverlay();
  
  // Deactivate all tabs and panes
  overlay.querySelectorAll('.tab-button').forEach(btn => {
    btn.setAttribute('aria-selected', 'false');
  });
  overlay.querySelectorAll('.tab-pane').forEach(pane => {
    pane.style.display = 'none';
  });
  
  // Activate selected tab and pane
  const btn = overlay.querySelector(`[data-tab="${tabName}"]`);
  const pane = overlay.querySelector(`[id="${tabName}-content"]`);
  
  if (btn) btn.setAttribute('aria-selected', 'true');
  if (pane) pane.style.display = 'block';
  
  currentActiveTab = tabName;
}

/**
 * Set content for a specific tab
 */
export function setTabContent(tabName, htmlContent) {
  const overlay = getOrCreateOverlay();
  const pane = overlay.querySelector(`[id="${tabName}-content"]`);
  
  if (pane) {
    pane.innerHTML = htmlContent;
  }
}

/**
 * Append content to a specific tab
 */
export function appendToTabContent(tabName, htmlContent) {
  const overlay = getOrCreateOverlay();
  const pane = overlay.querySelector(`[id="${tabName}-content"]`);
  
  if (pane) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    while (temp.firstChild) {
      pane.appendChild(temp.firstChild);
    }
  }
}

/**
 * Clear content of a specific tab
 */
export function clearTabContent(tabName) {
  const overlay = getOrCreateOverlay();
  const pane = overlay.querySelector(`[id="${tabName}-content"]`);
  
  if (pane) {
    pane.innerHTML = '';
  }
}

/**
 * Get current active tab name
 */
export function getCurrentTab() {
  return currentActiveTab || 'slide-edit';
}