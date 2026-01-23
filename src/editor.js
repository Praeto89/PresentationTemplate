// ════════════════════════════════════════════════════════════════════════════
// EDITOR - Web-based slide editor with localStorage persistence
// ════════════════════════════════════════════════════════════════════════════

let editMode = false;
let currentEditingSlide = null;

/**
 * Initialize editor mode if ?mode=edit is in URL
 */
export function initEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  editMode = urlParams.get('mode') === 'edit';
  
  if (!editMode) return;
  
  console.log('[Editor] Edit mode activated');
  document.body.classList.add('edit-mode');
  
  // Add edit UI after Reveal.js is ready
  addEditorControls();
  
  // Wait for Reveal.js to be ready
  console.log('[Editor] Reveal available?', typeof Reveal !== 'undefined');
  
  if (typeof Reveal !== 'undefined' && Reveal.isReady) {
    // Reveal is already ready
    console.log('[Editor] Reveal already ready, enabling now');
    validateSlideStructure();
    enableInlineEditing();
    applyStoredEdits();
    setupSlideChangeListener();
  } else if (typeof Reveal !== 'undefined' && Reveal.on) {
    // Wait for ready event
    console.log('[Editor] Waiting for Reveal ready event...');
    Reveal.on('ready', () => {
      console.log('[Editor] Reveal ready, enabling inline editing');
      validateSlideStructure();
      enableInlineEditing();
      applyStoredEdits();
      setupSlideChangeListener();
    });
  } else {
    // Fallback: wait a bit and try
    console.log('[Editor] Using fallback timeout...');
    setTimeout(() => {
      console.log('[Editor] Timeout fired, enabling editing');
      validateSlideStructure();
      enableInlineEditing();
      applyStoredEdits();
      setupSlideChangeListener();
    }, 1000);
  }
}

/**
 * Setup listener for slide changes to enable editing on new slides
 */
function setupSlideChangeListener() {
  if (typeof Reveal === 'undefined') return;
  
  Reveal.on('slidechanged', () => {
    console.log('[Editor] Slide changed, re-enabling editing');
    setTimeout(() => {
      enableInlineEditing();
    }, 100);
  });
}

/**
 * Validate that all detail-slides have correct parent-topic relationships
 */
function validateSlideStructure() {
  console.log('[Editor] Validating slide structure...');
  
  const detailSlides = document.querySelectorAll('.detail-slide');
  let valid = 0;
  let warnings = 0;
  
  detailSlides.forEach((slide) => {
    const parentTopic = slide.dataset.parentTopic;
    const section = slide.closest('section.stack');
    
    if (!section) {
      console.warn('[Editor] Detail slide without parent section:', slide);
      warnings++;
      return;
    }
    
    const topicId = section.dataset.topicId;
    
    if (!parentTopic) {
      console.warn('[Editor] Detail slide missing data-parent-topic:', slide);
      warnings++;
      return;
    }
    
    if (!topicId) {
      console.warn('[Editor] Parent section missing data-topic-id:', section);
      warnings++;
      return;
    }
    
    if (parentTopic !== topicId) {
      console.warn(`[Editor] Topic mismatch: slide has '${parentTopic}', section has '${topicId}'`, slide);
      warnings++;
      return;
    }
    
    valid++;
  });
  
  console.log(`[Editor] Validation: ${valid} valid, ${warnings} warnings out of ${detailSlides.length} detail slides`);
  
  if (warnings === 0) {
    showNotification('✓ Slide structure validated successfully', 'success');
  } else {
    showNotification(`⚠ ${warnings} slide structure warnings (check console)`, 'error');
  }
}

/**
 * Add global editor controls (export button, toggle edit mode)
 */
function addEditorControls() {
  // Setup Ctrl+S to export HTML
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      exportHTML();
    }
  });
  
  console.log('[Editor] Auto-save mode active - Press Ctrl+S to export HTML');
  
  // Show persistent hint
  const hint = document.createElement('div');
  hint.className = 'editor-hint';
  hint.innerHTML = '📝 Edit Mode | Ctrl+S to export';
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
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  `;
  document.body.appendChild(hint);
}

/**
 * Enable inline editing for all editable elements
 */
function enableInlineEditing() {
  // Overview title
  document.querySelectorAll('.overview-title').forEach(el => {
    makeEditable(el);
  });
  
  // Group subtitles
  document.querySelectorAll('.group-intro .group-subtitle').forEach(el => {
    makeEditable(el);
  });
  
  // Detail slides: Make title + all paragraphs editable
  document.querySelectorAll('.detail-slide').forEach(slide => {
    // Make title editable
    const title = slide.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
    if (title) makeEditable(title);
    
    // Make all paragraphs editable
    const paragraphs = slide.querySelectorAll(':scope > p');
    paragraphs.forEach(p => makeEditable(p));

    // Make direct text divs editable (WYSIWYG-added divs with spans/lines)
    const textDivs = slide.querySelectorAll(':scope > div');
    textDivs.forEach(div => {
      // skip divs that are clearly controls (buttons inside) or empty
      if (div.querySelector('button')) return;
      if (!div.textContent || !div.textContent.trim()) return;
      makeEditable(div);
    });
  });

  // Nav-Boxen ebenfalls editierbar machen (Titel und Text)
  document.querySelectorAll('.nav-box h4, .nav-box p').forEach(el => {
    makeEditable(el);
  });
  
  console.log(`[Editor] Inline editing enabled for title + all paragraphs per detail slide`);
  showNotification('Edit mode aktiv – Titel + alle Absätze pro Slide');
}

/**
 * Make an element editable with visual indicators
 */
function makeEditable(element) {
  // Skip if already editable
  if (element.contentEditable === 'true') return;
  
  element.contentEditable = 'true';
  element.classList.add('editable-field');
  
  // Add visual indicator
  element.style.outline = '2px dashed rgba(52, 152, 219, 0.3)';
  element.style.outlineOffset = '4px';
  element.style.transition = 'outline 0.2s';
  
  // Highlight on focus
  element.addEventListener('focus', () => {
    element.style.outline = '2px solid rgba(52, 152, 219, 0.8)';
  });
  
  element.addEventListener('blur', () => {
    element.style.outline = '2px dashed rgba(52, 152, 219, 0.3)';
    saveElementContent(element);
  });
  
  // Save on Enter key (for single-line fields)
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && element.tagName !== 'P') {
      e.preventDefault();
      element.blur();
    }
  });
}

/**
 * Ensure nav boxes are not editable to prevent accidental desync
 */
function enforceNavBoxReadOnly() {
  document.querySelectorAll('.nav-box h4, .nav-box p').forEach((el) => {
    if (el.contentEditable === 'true') {
      el.contentEditable = 'false';
    }
    el.classList.remove('editable-field');
    el.style.outline = '';
    el.style.outlineOffset = '';
  });
}

/**
 * Save element content to localStorage
 */
function saveElementContent(element) {
  const content = element.innerHTML;
  const identifier = getElementIdentifier(element);
  
  if (!identifier) return;
  
  const edits = loadStoredEdits();
  edits[identifier] = content;
  localStorage.setItem('slideEdits', JSON.stringify(edits));
  
  console.log(`[Editor] Saved: ${identifier}`);
  
  // Sync detail-slide changes to nav-box
  syncDetailToNavBox(element);
  
  showNotification('Changes saved!', 'success');
}

/**
 * Sync detail-slide content to corresponding nav-box
 */
function syncDetailToNavBox(element) {
  // Check if this is a detail-slide element
  const detailSlide = element.closest('.detail-slide');
  if (!detailSlide) return;
  
  // Verify parent-topic relationship for safety
  const parentTopic = detailSlide.dataset.parentTopic;
  const section = detailSlide.closest('section.stack');
  if (!section) return;
  
  // Verify section has matching topic-id
  if (parentTopic && section.dataset.topicId && section.dataset.topicId !== parentTopic) {
    console.warn(`[Editor] Parent topic mismatch: detail has '${parentTopic}', section has '${section.dataset.topicId}'`);
    return;
  }

  // Horizontal index (h)
  let hIndex;
  if (detailSlide.dataset.indexH) {
    hIndex = parseInt(detailSlide.dataset.indexH, 10);
  } else if (typeof Reveal !== 'undefined') {
    try { hIndex = Reveal.getIndices().h; } catch { /* noop */ }
  }
  if (typeof hIndex !== 'number') {
    const allSections = document.querySelectorAll('.reveal .slides > section');
    hIndex = Array.from(allSections).indexOf(section);
  }

  // Vertical index (v)
  let vIndex;
  if (detailSlide.dataset.indexV) {
    vIndex = parseInt(detailSlide.dataset.indexV, 10);
  } else if (typeof Reveal !== 'undefined' && detailSlide.classList.contains('present')) {
    try { vIndex = Reveal.getIndices().v; } catch { /* noop */ }
  }
  if (typeof vIndex !== 'number') {
    // Compute v as position among all section children (not only .detail-slide)
    const vCandidates = Array.from(section.children).filter(n => n.tagName === 'SECTION');
    vIndex = vCandidates.indexOf(detailSlide);
  }
  
  // Find corresponding nav-box
  const navBox = document.querySelector(`.nav-box[data-target-h="${hIndex}"][data-target-v="${vIndex}"]`);
  if (!navBox) {
    console.log(`[Editor] No nav-box found for h=${hIndex}, v=${vIndex} (parent-topic: ${parentTopic})`);
    return;
  }
  
  // Build fresh content based on detail slide (direct children only)
  const fragment = document.createDocumentFragment();

  // Title from detail-slide (h3 or h5)
  const detailTitle = detailSlide.querySelector('h3, h5');
  if (detailTitle) {
    const navTitle = document.createElement('h4');
    navTitle.className = detailTitle.className || '';
    // Use textContent to avoid nested div/br duplication
    navTitle.textContent = detailTitle.textContent;
    fragment.appendChild(navTitle);
  }

  // Direct paragraph children only (avoid nested/duplicated nodes)
  const directPs = Array.from(detailSlide.children).filter(
    (n) => n.tagName === 'P'
  );

  let paraCount = 0;
  directPs.forEach((p) => {
    const text = p.textContent.trim();
    if (!text) return; // skip empty paragraphs
    const newP = document.createElement('p');
    newP.className = p.className || '';
    // Use textContent to normalize content
    newP.textContent = text;
    fragment.appendChild(newP);
    paraCount += 1;
  });

  // If box is expanded, update its stored originalContent to prevent duplication
  if (navBox.classList.contains('expanded')) {
    const tmp = document.createElement('div');
    tmp.appendChild(fragment.cloneNode(true));
    navBox.dataset.originalContent = tmp.innerHTML;
  } else {
    // Replace content when not expanded
    navBox.innerHTML = '';
    navBox.appendChild(fragment);
  }

  console.log(`[Editor] Synced detail-slide to nav-box (title + ${paraCount} paragraphs)`);
}

/**
 * Get unique identifier for an element
 */
function getElementIdentifier(element) {
  // Find the parent slide
  const slide = element.closest('section');
  if (!slide) return null;
  
  // Get slide index
  const allSlides = document.querySelectorAll('.reveal .slides section');
  const slideIndex = Array.from(allSlides).indexOf(slide);
  
  // Get element type and index within slide
  const tagName = element.tagName.toLowerCase();
  const className = element.className.replace(/\s+/g, '_');
  const siblings = slide.querySelectorAll(tagName + '.' + element.className.split(' ')[0]);
  const elementIndex = Array.from(siblings).indexOf(element);
  
  return `slide_${slideIndex}_${tagName}_${className}_${elementIndex}`;
}

/**
 * Apply stored edits on page load
 */
function applyStoredEdits() {
  const edits = loadStoredEdits();
  
  Object.keys(edits).forEach(identifier => {
    const content = edits[identifier];
    const element = findElementByIdentifier(identifier);
    
    if (element && content) {
      // Skip applying stored edits to nav boxes; they sync from detail slides
      if (element.closest('.nav-box')) return;
      element.innerHTML = content;
    }
  });
  
  console.log(`[Editor] Applied ${Object.keys(edits).length} stored edits`);

  // After applying stored edits, resync all nav boxes so they reflect detail slides
  // This ensures sections like Beweggründe (h=1) are correct on initial load
  try {
    resyncAllNavBoxesFromDetailSlides();
  } catch (e) {
    console.warn('[Editor] Resync after stored edits failed:', e);
  }
}

/**
 * Resync all nav boxes from their corresponding detail slides
 * Runs on load after applying stored edits
 */
function resyncAllNavBoxesFromDetailSlides() {
  const detailSlides = document.querySelectorAll('.detail-slide');
  let synced = 0;
  detailSlides.forEach((slide) => {
    // Reuse existing logic; it accepts any element within the slide
    syncDetailToNavBox(slide);
    synced += 1;
  });
  console.log(`[Editor] Resynced ${synced} nav boxes from detail slides`);
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
  
  const elements = slide.querySelectorAll(tagName + '.' + className.split('_')[0]);
  return elements[elementIndex];
}

/**
 * Load stored edits from localStorage
 */
function loadStoredEdits() {
  const stored = localStorage.getItem('slideEdits');
  return stored ? JSON.parse(stored) : {};
}

/**
 * Export edited HTML
 */
function exportHTML() {
  // Clone the current document
  const clone = document.documentElement.cloneNode(true);

  // Remove Reveal runtime artifacts (backgrounds, controls, inline layout styles)
  cleanupRevealRuntime(clone);
  
  // Remove editor UI elements
  clone.querySelectorAll('.editor-controls, .edit-slide-btn, .editor-modal, .editor-hint').forEach(el => el.remove());
  // Remove runtime-only UI elements (toasts, overlays)
  clone.querySelectorAll('.notification-toast, .nav-box-overlay').forEach(el => el.remove());
  
  // Remove contenteditable and editor styling
  clone.querySelectorAll('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
    el.classList.remove('editable-field');
    el.style.outline = '';
    el.style.outlineOffset = '';
  });

  // Sanitize MS Office markup and nested paragraphs
  try {
    purgeMsOfficeMarkup(clone);
  } catch (e) {
    console.warn('[Editor] Sanitizer failed, continuing export:', e);
  }
  
  // Remove edit mode class from body
  const body = clone.querySelector('body');
  if (body) {
    body.classList.remove('edit-mode');
  }
  
  // Generate HTML string
  const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
  
  // Send to save server
  fetch('http://localhost:8001/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html: htmlContent })
  })
  .then(response => response.json())
  .then(data => {
    console.log('[Editor] Server response:', data);
    // Clear localStorage since HTML file is now the source of truth
    localStorage.removeItem('slideEdits');
    console.log('[Editor] Cleared localStorage after successful save');
    showNotification('✅ Saved to index.html! Reload to see changes.', 'success');
  })
  .catch(error => {
    console.error('[Editor] Save error:', error);
    showNotification('❌ Save failed! Is save_server.py running?', 'error');
  });
}

/**
 * Purge MS Office paste artifacts and fix nested paragraphs in a document root
 */
function purgeMsOfficeMarkup(root) {
  // Remove Office namespace elements like <o:p>
  root.querySelectorAll('o\\:p').forEach(el => el.remove());

  // Strip MSO-specific style declarations from inline styles
  root.querySelectorAll('[style]').forEach(el => {
    const styleAttr = el.getAttribute('style');
    if (!styleAttr) return;
    const cleaned = styleAttr
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !/^mso-/i.test((s.split(':')[0] || '').trim()))
      .join('; ');
    if (cleaned) el.setAttribute('style', cleaned);
    else el.removeAttribute('style');
  });

  // Remove MS Office classes like MsoNormal
  root.querySelectorAll('.MsoNormal').forEach(el => {
    el.classList.remove('MsoNormal');
    if (!el.className) el.removeAttribute('class');
  });

  // Unwrap nested <p> elements
  let nested;
  // Loop until no nested p remains
  while ((nested = root.querySelector('p p'))) {
    const parent = nested.parentElement;
    // Move children of nested p before it
    while (nested.firstChild) parent.insertBefore(nested.firstChild, nested);
    nested.remove();
  }

  // Remove empty paragraphs
  root.querySelectorAll('p').forEach(p => {
    const onlyWhitespace = !p.textContent || !p.textContent.trim();
    if (onlyWhitespace && p.children.length === 0) p.remove();
  });
}

/**
 * Show notification message
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

// Remove Reveal.js runtime-generated nodes and inline layout styles from a cloned document
function cleanupRevealRuntime(root) {
  const reveal = root.querySelector('.reveal');
  if (!reveal) return;

  // Drop runtime containers that Reveal injects
  reveal.querySelectorAll('.backgrounds, .progress, .controls, .slide-number, .speaker-notes, .pause-overlay, .aria-status').forEach(el => el.remove());

  // Clean inline styles and data attributes that are purely runtime state
  reveal.removeAttribute('style');
  const slides = reveal.querySelector('.slides');
  if (slides) {
    slides.removeAttribute('style');
    slides.querySelectorAll('section').forEach(sec => {
      sec.removeAttribute('style');
      sec.removeAttribute('data-index-h');
      sec.removeAttribute('data-index-v');
      sec.removeAttribute('data-previous-indexv');
    });
  }
}