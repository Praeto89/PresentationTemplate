/**
 * ════════════════════════════════════════════════════════════════════════════
 * SLIDE EDITOR
 * Inline editing of slide content (titles, text, nav-boxes).
 * Persists edits to localStorage and syncs detail-slides ↔ nav-boxes.
 * ════════════════════════════════════════════════════════════════════════════
 */

import { getSlideEdits, saveSlideEdits } from './storage.js';
import { showNotification } from './utils/notification.js';

/* ── public API ─────────────────────────────────────────────────────────── */

/**
 * One-time setup: validate structure, enable editing, apply stored edits,
 * listen for slide changes and Ctrl+S shortcut.
 */
export function setupSlideEditing() {
  console.log('[SlideEditor] Setting up slide editing');

  validateSlideStructure();
  enableInlineEditing();
  applyStoredEdits();

  // Re-enable editing whenever Reveal.js changes slides
  if (typeof Reveal !== 'undefined') {
    Reveal.on('slidechanged', () => {
      setTimeout(() => enableInlineEditing(), 100);
    });
  }

  // Ctrl+S → export (handled by export-html module, but we import lazily)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Lazy-load to avoid circular deps
      import('./export-html.js').then(({ exportHTML }) => exportHTML());
    }
  });

  // Listen for custom event when nav-boxes expand (content cloned into box)
  document.addEventListener('navbox-expanded', (e) => {
    const container = e.detail && e.detail.container;
    if (container) {
      enableEditingInContainer(container);
    }
  });

  // Editor hint badge
  const hint = document.createElement('div');
  hint.className = 'editor-hint';
  hint.innerHTML = '📝 Edit Mode | Ctrl+S to export | Ctrl+E for admin';
  document.body.appendChild(hint);

  console.log('[SlideEditor] Slide editing setup complete');
}

/**
 * Enable inline editing on the current slide set.
 * Safe to call repeatedly (idempotent per element).
 */
export function enableInlineEditing() {
  document.querySelectorAll('.overview-title').forEach(makeEditable);
  document.querySelectorAll('.overview-subtitle').forEach(makeEditable);
  document.querySelectorAll('.group-intro .group-subtitle').forEach(makeEditable);

  // Make circle titles on the overview editable
  document.querySelectorAll('.circle-item .circle-text').forEach(makeEditable);

  document.querySelectorAll('.detail-slide').forEach((slide) => {
    const title = slide.querySelector(
      ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6',
    );
    if (title) makeEditable(title);

    slide.querySelectorAll(':scope > p').forEach(makeEditable);

    slide.querySelectorAll(':scope > div').forEach((div) => {
      if (div.querySelector('button')) return;
      if (!div.textContent || !div.textContent.trim()) return;
      makeEditable(div);
    });
  });

  // Also make nav-box titles editable (created after syncDetailToNavBox)
  document.querySelectorAll('.nav-box h4, .nav-box p, .nav-box .box-title').forEach(makeEditable);

  // Make elements inside expanded nav-boxes editable
  document.querySelectorAll('.nav-box.expanded h3, .nav-box.expanded h5, .nav-box.expanded p').forEach(makeEditable);

  // Make closing-slide content editable
  document.querySelectorAll('.closing-slide h2, .closing-slide p').forEach(makeEditable);

  console.log('[SlideEditor] Inline editing enabled');
}

/**
 * Enable editing on all text elements inside a container.
 * Used after expanding nav-boxes to make cloned content editable.
 */
export function enableEditingInContainer(container) {
  if (!container) return;
  container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(makeEditable);
  container.querySelectorAll('p').forEach(makeEditable);
  container.querySelectorAll('div').forEach((div) => {
    if (div.querySelector('button')) return;
    if (!div.textContent || !div.textContent.trim()) return;
    makeEditable(div);
  });
}

/**
 * Resync every detail-slide → nav-box preview.
 */
export function resyncAllNavBoxesFromDetailSlides() {
  const detailSlides = document.querySelectorAll('.detail-slide');
  let synced = 0;
  detailSlides.forEach((slide) => {
    syncDetailToNavBox(slide);
    synced++;
  });
  console.log(`[SlideEditor] Resynced ${synced} nav boxes`);
}

/* ── internal helpers ───────────────────────────────────────────────────── */

function validateSlideStructure() {
  console.log('[SlideEditor] Validating slide structure...');

  const detailSlides = document.querySelectorAll('.detail-slide');
  let valid = 0;
  let warnings = 0;

  detailSlides.forEach((slide) => {
    const parentTopic = slide.dataset.parentTopic;
    const section = slide.closest('section.stack');

    if (!section) {
      console.warn('[SlideEditor] Detail slide without parent section:', slide);
      warnings++;
      return;
    }

    const topicId = section.dataset.topicId;

    if (!parentTopic || !topicId || parentTopic !== topicId) {
      console.warn('[SlideEditor] Topic mismatch:', slide);
      warnings++;
      return;
    }

    valid++;
  });

  console.log(`[SlideEditor] Validation: ${valid} valid, ${warnings} warnings`);
}

function makeEditable(element) {
  if (element.contentEditable === 'true') return;

  element.contentEditable = 'true';
  element.classList.add('editable-field');

  // Disable Reveal.js keyboard when editing so typed characters
  // are not swallowed as navigation shortcuts (f, s, o, b …)
  element.addEventListener('focus', () => {
    if (typeof Reveal !== 'undefined') {
      Reveal.configure({ keyboard: false });
    }
  });

  element.addEventListener('blur', () => {
    // Re-enable Reveal.js keyboard
    if (typeof Reveal !== 'undefined') {
      Reveal.configure({ keyboard: true });
    }
    saveElementContent(element);
  });

  element.addEventListener('keydown', (e) => {
    // Escape → leave editing
    if (e.key === 'Escape') {
      e.preventDefault();
      element.blur();
      return;
    }
    // Enter (without Shift) on non-paragraph elements → leave editing
    if (e.key === 'Enter' && !e.shiftKey && element.tagName !== 'P' && element.tagName !== 'DIV') {
      e.preventDefault();
      element.blur();
      return;
    }
    // Stop ALL key events from bubbling to Reveal.js while editing
    e.stopPropagation();
  });

  // Also stop keyup / keypress to be safe
  element.addEventListener('keyup', (e) => e.stopPropagation());
  element.addEventListener('keypress', (e) => e.stopPropagation());
}

function saveElementContent(element) {
  const content = element.innerHTML;

  // Check if the element is inside an expanded nav-box (clone)
  const expandedBox = element.closest('.nav-box.expanded');
  let identifier;

  if (expandedBox) {
    // Element is a clone inside expanded nav-box — resolve via original slide
    const targetH = parseInt(expandedBox.dataset.targetH, 10);
    const targetV = parseInt(expandedBox.dataset.targetV, 10);
    if (typeof Reveal !== 'undefined') {
      const originalSlide = Reveal.getSlide(targetH, targetV);
      if (originalSlide) {
        identifier = getIdentifierRelativeToSlide(element, originalSlide, expandedBox);
      }
    }
  } else {
    identifier = getElementIdentifier(element);
  }

  if (!identifier) return;

  const edits = getSlideEdits();
  edits[identifier] = content;
  saveSlideEdits(edits);

  console.log(`[SlideEditor] Saved: ${identifier}`);

  syncDetailToNavBox(element);
  showNotification('Änderungen gespeichert!', 'success');
}

/**
 * Build an identifier for a cloned element by matching its position
 * relative to the original slide rather than the clone container.
 */
function getIdentifierRelativeToSlide(clonedElement, originalSlide, expandedBox) {
  const allSlides = document.querySelectorAll('.reveal .slides section');
  const slideIndex = Array.from(allSlides).indexOf(originalSlide);
  if (slideIndex < 0) return null;

  const tagName = clonedElement.tagName.toLowerCase();

  // Find the position of the cloned element among siblings of the same
  // tag inside the expanded-content clone (which mirrors the original slide).
  const cloneRoot = expandedBox.querySelector('.expanded-content') || expandedBox;
  const cloneSiblings = cloneRoot.querySelectorAll(tagName);
  const cloneIndex = Array.from(cloneSiblings).indexOf(clonedElement);

  // Match position in original slide
  const origSiblings = originalSlide.querySelectorAll(tagName);
  const origElement = origSiblings[cloneIndex];
  if (!origElement) return null;

  // Also update the original slide element in place
  origElement.innerHTML = clonedElement.innerHTML;

  const className = origElement.className.replace(/\s+/g, '_');
  const classSiblings = originalSlide.querySelectorAll(tagName + '.' + origElement.className.split(' ')[0]);
  const elementIndex = Array.from(classSiblings).indexOf(origElement);

  return `slide_${slideIndex}_${tagName}_${className}_${elementIndex}`;
}

function syncDetailToNavBox(element) {
  // element may be a detail-slide itself (resync) or a child of one
  const detailSlide =
    element.classList.contains('detail-slide') ? element : element.closest('.detail-slide');
  if (!detailSlide) return;

  const section = detailSlide.closest('section.stack');
  if (!section) return;

  let hIndex;
  if (detailSlide.dataset.indexH) {
    hIndex = parseInt(detailSlide.dataset.indexH, 10);
  } else if (typeof Reveal !== 'undefined') {
    try {
      hIndex = Reveal.getIndices().h;
    } catch {
      /* ignore */
    }
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
    } catch {
      /* ignore */
    }
  }
  if (typeof vIndex !== 'number') {
    const vCandidates = Array.from(section.children).filter((n) => n.tagName === 'SECTION');
    vIndex = vCandidates.indexOf(detailSlide);
  }

  const navBox = document.querySelector(
    `.nav-box[data-target-h="${hIndex}"][data-target-v="${vIndex}"]`,
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

  const directPs = Array.from(detailSlide.children).filter((n) => n.tagName === 'P');

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

  console.log('[SlideEditor] Synced detail-slide to nav-box');
}

function getElementIdentifier(element) {
  const slide = element.closest('section');
  if (!slide) return null;

  const allSlides = document.querySelectorAll('.reveal .slides section');
  const slideIndex = Array.from(allSlides).indexOf(slide);

  const tagName = element.tagName.toLowerCase();
  const className = element.className.replace(/\s+/g, '_');
  const siblings = slide.querySelectorAll(tagName + '.' + element.className.split(' ')[0]);
  const elementIndex = Array.from(siblings).indexOf(element);

  return `slide_${slideIndex}_${tagName}_${className}_${elementIndex}`;
}

function applyStoredEdits() {
  const edits = getSlideEdits();

  Object.keys(edits).forEach((identifier) => {
    const content = edits[identifier];
    const element = findElementByIdentifier(identifier);

    if (element && content && !element.closest('.nav-box')) {
      element.innerHTML = content;
    }
  });

  console.log(`[SlideEditor] Applied ${Object.keys(edits).length} stored edits`);

  try {
    resyncAllNavBoxesFromDetailSlides();
  } catch (e) {
    console.warn('[SlideEditor] Resync failed:', e);
  }
}

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
