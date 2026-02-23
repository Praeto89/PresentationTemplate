/**
 * ════════════════════════════════════════════════════════════════════════════
 * SLIDE EDITOR
 * Inline editing of slide content (titles, text, nav-boxes).
 * Persists edits to localStorage and syncs detail-slides ↔ nav-boxes.
 * ════════════════════════════════════════════════════════════════════════════
 */

import { loadStudentSlideEdits, saveStudentSlideEdits } from './storage.js';
import { showNotification } from './utils/notification.js';
import { setTabContent } from './overlay.js';
import {
  getAllStudents,
  getCurrentStudentIndex,
  isLayerModeEnabled,
} from './student-manager.js';
import { handleStudentSwitch } from './student-layer-controller.js';

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

/* ── Slide-Edit Tab (Overlay) ───────────────────────────────────────────── */

/**
 * Build and inject the "Slides bearbeiten" tab content into the overlay.
 * Shows a structured tree: Overview → Topics → Detail Slides, each with
 * editable text fields that sync back to the live DOM.
 */
export function populateSlideEditTab() {
  const html = buildSlideEditHTML();
  setTabContent('slide-edit', html);
  wireSlideEditEvents();
  console.log('[SlideEditor] Slide-edit tab populated');
}

/**
 * Scan the DOM and build the HTML for the slide-edit panel.
 */
function buildSlideEditHTML() {
  let html = '<div class="se-panel">';

  html += buildStudentSelectorHTML();

  // ── 1. Overview Slide ────────────────────────────────────────────────
  const overviewSlide = document.querySelector('#overview, .overview-slide');
  if (overviewSlide) {
    const titleEl = overviewSlide.querySelector('.overview-title');
    const subtitleEls = overviewSlide.querySelectorAll('.overview-subtitle');

    html += `
      <div class="se-section">
        <div class="se-section-header" data-collapsed="false">
          <span class="se-collapse-icon">▼</span>
          <h3>🏠 Übersichtsfolie</h3>
        </div>
        <div class="se-section-body">
          <label class="se-label">Titel</label>
          <div class="se-field" contenteditable="true"
               data-se-target="overview-title">${titleEl ? titleEl.innerHTML : ''}</div>`;

    subtitleEls.forEach((el, i) => {
      html += `
          <label class="se-label">Untertitel ${i + 1}</label>
          <div class="se-field" contenteditable="true"
               data-se-target="overview-subtitle-${i}">${el.innerHTML}</div>`;
    });

    html += `
        </div>
      </div>`;
  }

  // ── 2. Topic Stacks ──────────────────────────────────────────────────
  const stacks = document.querySelectorAll('.reveal .slides > section.stack');
  stacks.forEach((stack, stackIdx) => {
    const topicId = stack.dataset.topicId || `topic-${stackIdx + 1}`;
    const groupIntro = stack.querySelector('.group-intro');
    const circleItem = document.querySelector(`.circle-item[data-slide="${stackIdx + 1}"]`);
    const circleText = circleItem ? circleItem.querySelector('.circle-text') : null;
    const topicName = circleText ? circleText.textContent.trim() : `Thema ${stackIdx + 1}`;

    html += `
      <div class="se-section">
        <div class="se-section-header" data-collapsed="false">
          <span class="se-collapse-icon">▼</span>
          <h3>📌 ${stackIdx + 1}. ${escapeHTML(topicName)}</h3>
        </div>
        <div class="se-section-body">`;

    // Group-intro subtitle
    if (groupIntro) {
      const subtitle = groupIntro.querySelector('.group-subtitle');
      if (subtitle) {
        html += `
          <label class="se-label">Überblick-Untertitel</label>
          <div class="se-field" contenteditable="true"
               data-se-target="group-subtitle-${topicId}">${subtitle.innerHTML}</div>`;
      }
    }

    // Detail slides
    const detailSlides = stack.querySelectorAll('.detail-slide');
    detailSlides.forEach((detail, detailIdx) => {
      const h = detail.querySelector('h1, h2, h3, h4, h5, h6');
      const paragraphs = Array.from(detail.querySelectorAll(':scope > p'));

      html += `
          <div class="se-detail">
            <div class="se-detail-header">
              <span class="se-detail-badge">Detail ${detailIdx + 1}</span>
            </div>
            <label class="se-label">Titel</label>
            <div class="se-field" contenteditable="true"
                 data-se-target="detail-title-${topicId}-${detailIdx}">${h ? h.innerHTML : ''}</div>`;

      paragraphs.forEach((p, pIdx) => {
        html += `
            <label class="se-label">Absatz ${pIdx + 1}</label>
            <div class="se-field se-field-multiline" contenteditable="true"
                 data-se-target="detail-p-${topicId}-${detailIdx}-${pIdx}">${p.innerHTML}</div>`;
      });

      // Button to add a new paragraph
      html += `
            <button class="se-add-paragraph-btn" data-topic="${topicId}" data-detail="${detailIdx}">
              + Absatz hinzufügen
            </button>
          </div>`;
    });

    html += `
        </div>
      </div>`;
  });

  // ── 3. Closing Slide ─────────────────────────────────────────────────
  const closingSlide = document.querySelector('.closing-slide');
  if (closingSlide) {
    const closingTitle = closingSlide.querySelector('h2');
    const closingP = closingSlide.querySelector('p');

    html += `
      <div class="se-section">
        <div class="se-section-header" data-collapsed="false">
          <span class="se-collapse-icon">▼</span>
          <h3>🎬 Schlussfolie</h3>
        </div>
        <div class="se-section-body">
          <label class="se-label">Titel</label>
          <div class="se-field" contenteditable="true"
               data-se-target="closing-title">${closingTitle ? closingTitle.innerHTML : ''}</div>
          <label class="se-label">Text</label>
          <div class="se-field" contenteditable="true"
               data-se-target="closing-text">${closingP ? closingP.innerHTML : ''}</div>
        </div>
      </div>`;
  }

  html += '</div>';
  return html;
}

function buildStudentSelectorHTML() {
  if (!isLayerModeEnabled()) {
    return '';
  }

  const students = getAllStudents();
  if (!students.length) {
    return `
      <div class="se-student-switcher">
        <label class="se-label">Aktiver Schüler</label>
        <div class="se-student-hint">Keine Schüler angelegt.</div>
      </div>`;
  }

  const currentIndex = getCurrentStudentIndex();
  const options = students
    .map((student, index) => {
      const selected = index === currentIndex ? ' selected' : '';
      return `<option value="${index}"${selected}>${escapeHTML(student.name)}</option>`;
    })
    .join('');

  return `
    <div class="se-student-switcher">
      <label for="se-student-selector" class="se-label">Aktiver Schüler</label>
      <select id="se-student-selector" class="se-student-selector">
        ${options}
      </select>
    </div>`;
}

/**
 * Wire up event listeners for the slide-edit panel fields.
 */
function wireSlideEditEvents() {
  const panel = document.querySelector('#slide-edit-content');
  if (!panel) return;

  const studentSelector = panel.querySelector('#se-student-selector');
  if (studentSelector) {
    studentSelector.addEventListener('change', async (event) => {
      const newStudentIndex = parseInt(event.target.value, 10);
      if (Number.isNaN(newStudentIndex)) return;

      studentSelector.disabled = true;
      try {
        await handleStudentSwitch(newStudentIndex);
        populateSlideEditTab();
      } finally {
        studentSelector.disabled = false;
      }
    });
  }

  // ── Collapsible sections ─────────────────────────────────────────────
  panel.querySelectorAll('.se-section-header').forEach((header) => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const icon = header.querySelector('.se-collapse-icon');
      const collapsed = header.dataset.collapsed === 'true';
      header.dataset.collapsed = collapsed ? 'false' : 'true';
      body.style.display = collapsed ? '' : 'none';
      icon.textContent = collapsed ? '▼' : '▶';
    });
  });

  // ── Editable fields → sync to live DOM on blur ───────────────────────
  panel.querySelectorAll('.se-field').forEach((field) => {
    // Disable Reveal keyboard while typing
    field.addEventListener('focus', () => {
      if (typeof Reveal !== 'undefined') Reveal.configure({ keyboard: false });
    });

    field.addEventListener('blur', () => {
      if (typeof Reveal !== 'undefined') Reveal.configure({ keyboard: true });
      syncFieldToDOM(field);
    });

    // Block key events from reaching Reveal
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); field.blur(); return; }
      e.stopPropagation();
    });
    field.addEventListener('keyup', (e) => e.stopPropagation());
    field.addEventListener('keypress', (e) => e.stopPropagation());
  });

  // ── "Add paragraph" buttons ──────────────────────────────────────────
  panel.querySelectorAll('.se-add-paragraph-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const topicId = btn.dataset.topic;
      const detailIdx = parseInt(btn.dataset.detail, 10);
      addParagraphToDetail(topicId, detailIdx, btn);
    });
  });
}

/**
 * Sync a single overlay field back to the live slide DOM element.
 */
function syncFieldToDOM(field) {
  const target = field.dataset.seTarget;
  if (!target) return;

  const content = field.innerHTML;

  // ── Overview fields ──────────────────────────────────────────────────
  if (target === 'overview-title') {
    const el = document.querySelector('.overview-title');
    if (el) { el.innerHTML = content; saveInlineEdit(el); }
    return;
  }
  if (target.startsWith('overview-subtitle-')) {
    const idx = parseInt(target.split('-').pop(), 10);
    const els = document.querySelectorAll('.overview-subtitle');
    if (els[idx]) { els[idx].innerHTML = content; saveInlineEdit(els[idx]); }
    return;
  }

  // ── Closing slide ────────────────────────────────────────────────────
  if (target === 'closing-title') {
    const el = document.querySelector('.closing-slide h2');
    if (el) { el.innerHTML = content; saveInlineEdit(el); }
    return;
  }
  if (target === 'closing-text') {
    const el = document.querySelector('.closing-slide p');
    if (el) { el.innerHTML = content; saveInlineEdit(el); }
    return;
  }

  // ── Group subtitle ───────────────────────────────────────────────────
  if (target.startsWith('group-subtitle-')) {
    const topicId = target.replace('group-subtitle-', '');
    const stack = document.querySelector(`section.stack[data-topic-id="${topicId}"]`);
    if (stack) {
      const el = stack.querySelector('.group-intro .group-subtitle');
      if (el) { el.innerHTML = content; saveInlineEdit(el); }
    }
    return;
  }

  // ── Detail slide title ───────────────────────────────────────────────
  if (target.startsWith('detail-title-')) {
    const parts = target.replace('detail-title-', '').split('-');
    const detailIdx = parseInt(parts.pop(), 10);
    const topicId = parts.join('-');
    const stack = document.querySelector(`section.stack[data-topic-id="${topicId}"]`);
    if (stack) {
      const detail = stack.querySelectorAll('.detail-slide')[detailIdx];
      if (detail) {
        const h = detail.querySelector('h1, h2, h3, h4, h5, h6');
        if (h) { h.innerHTML = content; saveInlineEdit(h); syncDetailToNavBox(detail); }
      }
    }
    return;
  }

  // ── Detail slide paragraph ───────────────────────────────────────────
  if (target.startsWith('detail-p-')) {
    const parts = target.replace('detail-p-', '').split('-');
    const pIdx = parseInt(parts.pop(), 10);
    const detailIdx = parseInt(parts.pop(), 10);
    const topicId = parts.join('-');
    const stack = document.querySelector(`section.stack[data-topic-id="${topicId}"]`);
    if (stack) {
      const detail = stack.querySelectorAll('.detail-slide')[detailIdx];
      if (detail) {
        const ps = Array.from(detail.querySelectorAll(':scope > p'));
        if (ps[pIdx]) { ps[pIdx].innerHTML = content; saveInlineEdit(ps[pIdx]); syncDetailToNavBox(detail); }
      }
    }
    return;
  }
}

/**
 * Persist an individual element's content through the existing storage system.
 */
function saveInlineEdit(element) {
  const identifier = getElementIdentifier(element);
  if (!identifier) return;
  const edits = loadStudentSlideEdits();
  edits[identifier] = element.innerHTML;
  saveStudentSlideEdits(edits);
}

/**
 * Add a new paragraph to a detail slide and refresh the panel.
 */
function addParagraphToDetail(topicId, detailIdx) {
  const stack = document.querySelector(`section.stack[data-topic-id="${topicId}"]`);
  if (!stack) return;
  const detail = stack.querySelectorAll('.detail-slide')[detailIdx];
  if (!detail) return;

  // Insert before the return button
  const returnBtn = detail.querySelector('.return-to-main');
  const newP = document.createElement('p');
  newP.textContent = 'Neuer Absatz – hier Text eingeben';
  if (returnBtn) {
    detail.insertBefore(newP, returnBtn);
  } else {
    detail.appendChild(newP);
  }

  makeEditable(newP);
  saveInlineEdit(newP);

  // Re-populate the panel so the new paragraph shows up
  populateSlideEditTab();
  showNotification('Absatz hinzugefügt', 'success');
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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

  const edits = loadStudentSlideEdits();
  edits[identifier] = content;
  saveStudentSlideEdits(edits);

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
  const edits = loadStudentSlideEdits();

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
