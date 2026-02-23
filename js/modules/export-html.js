/**
 * ════════════════════════════════════════════════════════════════════════════
 * HTML EXPORT
 * Exports the current DOM as a clean index.html via the Python save server.
 * Strips Reveal.js runtime artefacts, editor UI, and MS Office markup.
 * ════════════════════════════════════════════════════════════════════════════
 */

import { showNotification } from './utils/notification.js';

/**
 * Clone the current page, clean it, and POST to save_server.py.
 */
export function exportHTML() {
  const clone = document.documentElement.cloneNode(true);

  cleanupRevealRuntime(clone);

  // Remove editor-injected elements
  clone
    .querySelectorAll('.editor-controls, .edit-slide-btn, .editor-modal, .editor-hint, .floating-edit-toggle, .edit-mode-switch, .floating-action-btn')
    .forEach((el) => el.remove());
  clone
    .querySelectorAll('.notification-toast, .nav-box-overlay, .student-selector-wrapper')
    .forEach((el) => el.remove());

  // Strip contentEditable attributes
  clone.querySelectorAll('[contenteditable]').forEach((el) => {
    el.removeAttribute('contenteditable');
    el.classList.remove('editable-field');
  });

  try {
    purgeMsOfficeMarkup(clone);
  } catch (e) {
    console.warn('[ExportHTML] Sanitizer failed:', e);
  }

  const body = clone.querySelector('body');
  if (body) {
    body.classList.remove('edit-mode');
  }

  const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;

  fetch('/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: htmlContent }),
  })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      console.log('[ExportHTML] Server response:', data);
      showNotification('✅ Gespeichert! Seite neu laden um Änderungen zu sehen.', 'success');
    })
    .catch((error) => {
      console.error('[ExportHTML] Save error:', error);
      showNotification(
        '❌ Speichern fehlgeschlagen! Wurde server.py gestartet?',
        'error',
      );
    });
}

/* ── internal helpers ───────────────────────────────────────────────────── */

/**
 * Remove Reveal.js runtime-generated elements and inline styles.
 */
function cleanupRevealRuntime(root) {
  const reveal = root.querySelector('.reveal');
  if (!reveal) return;

  reveal
    .querySelectorAll(
      '.backgrounds, .progress, .controls, .slide-number, .speaker-notes, .pause-overlay, .aria-status',
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
 * Strip MS Office / Word artefacts (o:p tags, mso-* styles, MsoNormal class).
 */
function purgeMsOfficeMarkup(root) {
  root.querySelectorAll('o\\:p').forEach((el) => el.remove());

  root.querySelectorAll('[style]').forEach((el) => {
    const styleAttr = el.getAttribute('style');
    if (!styleAttr) return;
    const cleaned = styleAttr
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && !/^mso-/i.test((s.split(':')[0] || '').trim()))
      .join('; ');
    if (cleaned) el.setAttribute('style', cleaned);
    else el.removeAttribute('style');
  });

  root.querySelectorAll('.MsoNormal').forEach((el) => {
    el.classList.remove('MsoNormal');
    if (!el.className) el.removeAttribute('class');
  });

  // Flatten nested <p> tags and remove empty paragraphs
  let nested;
  while ((nested = root.querySelector('p p'))) {
    const parent = nested.parentElement;
    while (nested.firstChild) parent.insertBefore(nested.firstChild, nested);
    nested.remove();
  }

  root.querySelectorAll('p').forEach((p) => {
    const onlyWhitespace = !p.textContent || !p.textContent.trim();
    if (onlyWhitespace && p.children.length === 0) p.remove();
  });
}
