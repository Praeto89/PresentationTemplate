/**
 * ════════════════════════════════════════════════════════════════════════════
 * STUDENT LAYER CONTROLLER - Verwaltet Layer-Umschaltung in der Präsentation
 * Behandelt UI-Interaktionen für Student-Dropdown und Auto-Save
 * ════════════════════════════════════════════════════════════════════════════
 */

import {
  isLayerModeEnabled,
  getCurrentStudent,
  getCurrentStudentIndex,
  switchStudent,
  saveStudentState,
  loadStudentState,
} from './student-manager.js';
import {
  getSlideEdits,
  loadStudentSlideEdits,
  saveStudentSlideEdits,
  loadStudentBookmarks,
  saveStudentBookmarks,
  getBookmarks,
  saveIndexHTML,
  getContentData,
} from './storage.js';
import {
  generateCompleteSlidesHTML,
  saveGenerationMetadata,
} from './slide-generator.js';

/**
 * Initialisiert Student-Layer-Controller
 * Wird aufgerufen nach Slide-Generator initialisiert wurde
 */
export function initStudentLayerController() {
  console.log('[StudentLayerController] Initializing...');
  
  if (!isLayerModeEnabled()) {
    console.log('[StudentLayerController] Layer mode disabled');
    return;
  }
  
  // Erstelle Student-Dropdown im DOM falls nicht vorhanden
  createStudentDropdownElement();
  
  // Setze Event-Listener für Dropdown
  setupStudentDropdownListener();
  
  // Lade die Präsentation für den aktuellen Schüler
  const currentStudent = getCurrentStudent();
  if (currentStudent) {
    console.log('[StudentLayerController] Loading presentation for current student:', currentStudent.name);
    
    // Restore title if option is enabled
    if (currentStudent.useNameAsTitle) {
      updateOverviewTitleForStudent(currentStudent.name);
    }
    
    // Load student-specific state
    const state = loadStudentState(getCurrentStudentIndex());
    if (state) {
      updateSlideEditsFromState(state.slideEdits);
      updateBookmarksFromState(state.bookmarks);
    }
  }
  
  console.log('[StudentLayerController] Initialized');
}

/**
 * Erstellt das Student-Dropdown-Element dynamisch im DOM
 */
function createStudentDropdownElement() {
  // Prüfe ob schon vorhanden
  if (document.getElementById('student-selector-wrapper')) {
    return;
  }
  
  const wrapper = document.createElement('div');
  wrapper.id = 'student-selector-wrapper';
  wrapper.className = 'student-selector-wrapper';
  
  const label = document.createElement('label');
  label.htmlFor = 'student-selector';
  label.textContent = '👤 Schüler:';
  label.className = 'student-selector-label';
  
  const select = document.createElement('select');
  select.id = 'student-selector';
  
  wrapper.appendChild(label);
  wrapper.appendChild(select);
  document.body.appendChild(wrapper);
  
  console.log('[StudentLayerController] Student dropdown created in DOM');
}

/**
 * Setzt Event-Listener für Student-Dropdown ein
 */
function setupStudentDropdownListener() {
  const selector = document.getElementById('student-selector');
  
  if (!selector) {
    console.warn('[StudentLayerController] Student selector element not found');
    return;
  }
  
  selector.addEventListener('change', async (e) => {
    const newStudentIndex = parseInt(e.target.value);
    console.log('[StudentLayerController] Student dropdown changed to:', newStudentIndex);
    
    await handleStudentSwitch(newStudentIndex);
  });
  
  console.log('[StudentLayerController] Dropdown listener attached');
}

/**
 * Behandelt Schülerwechsel mit Auto-Save
 * @param {number} newStudentIndex - Index des neuen Schülers
 */
export async function handleStudentSwitch(newStudentIndex) {
  const oldIndex = getCurrentStudentIndex();
  const oldStudent = getCurrentStudent();
  
  if (oldIndex === newStudentIndex) {
    return; // Kein Wechsel nötig
  }
  
  // Speichere aktuellen Schüler-State
  if (oldStudent) {
    const slideEdits = getSlideEdits();
    const bookmarks = getBookmarks();
    
    saveStudentState(oldIndex, {
      slideEdits,
      bookmarks,
    });
    
    console.log('[StudentLayerController] Auto-saved state for student:', oldStudent.name);
  }
  
  // Wechsle zu neuem Schüler
  const newStudent = switchStudent(newStudentIndex);
  
  if (!newStudent) {
    console.error('[StudentLayerController] Failed to switch to student:', newStudentIndex);
    return;
  }
  
  console.log('[StudentLayerController] Switched to student:', newStudent.name);
  
  // Lade neuen Schüler-State
  const state = loadStudentState(newStudentIndex);
  
  // Aktualisiere UI
  updateSlideEditsFromState(state.slideEdits);
  updateBookmarksFromState(state.bookmarks);
  
  // Update title if option is enabled
  if (newStudent.useNameAsTitle) {
    updateOverviewTitleForStudent(newStudent.name);
  } else {
    const contentData = getContentData();
    if (contentData && contentData.title) {
      updateOverviewTitleForStudent(contentData.title);
    }
  }
  
  // Regeneriere Präsentation
  await reloadPresentationForStudent();
}

/**
 * Aktualisiert den Titel der Übersichtsfolie
 * @param {string} title - Neuer Titel
 */
function updateOverviewTitleForStudent(title) {
  const overviewTitle = document.querySelector('.overview-title');
  if (overviewTitle) {
    const lines = overviewTitle.innerHTML.split('<br>');
    lines[0] = title;
    overviewTitle.innerHTML = lines.join('<br>');
    console.log('[StudentLayerController] Overview title updated to:', title);
  }
}

/**
 * Aktualisiert Slide-Edits im DOM basierend auf Schüler-State
 * @param {Object} slideEdits - Slide-Edit-Daten
 */
function updateSlideEditsFromState(slideEdits) {
  if (!slideEdits || typeof slideEdits !== 'object') return;
  
  // Slide edit keys use the identifier format: slide_{index}_{tag}_{class}_{elementIndex}
  // We need to look up elements using this identifier pattern
  for (const [identifier, html] of Object.entries(slideEdits)) {
    try {
      const parts = identifier.split('_');
      if (parts[0] !== 'slide' || parts.length < 5) continue;
      
      const slideIndex = parseInt(parts[1]);
      const tagName = parts[2];
      const className = parts[3];
      const elementIndex = parseInt(parts[4]);
      
      const slide = document.querySelectorAll('.reveal .slides section')[slideIndex];
      if (!slide) continue;
      
      const firstClass = className.split('_')[0];
      const elements = firstClass 
        ? slide.querySelectorAll(`${tagName}.${firstClass}`)
        : slide.querySelectorAll(tagName);
      
      if (elements[elementIndex]) {
        elements[elementIndex].innerHTML = html;
      }
    } catch (err) {
      console.warn('[StudentLayerController] Error applying slide edit:', identifier, err);
    }
  }
  
  console.log('[StudentLayerController] Applied slide edits for current student');
}

/**
 * Aktualisiert Bookmarks im DOM basierend auf Schüler-State
 * @param {Array} bookmarks - Array von Bookmark-Objekten
 */
function updateBookmarksFromState(bookmarks) {
  // Entferne alle Bookmark-Marker
  document.querySelectorAll('[data-bookmarked="true"]').forEach((el) => {
    el.removeAttribute('data-bookmarked');
  });
  
  // Setze neue Bookmarks
  bookmarks.forEach((bookmark) => {
    const selector = `[data-parent-id="${bookmark.parentId}"][data-child-index="${bookmark.childIndex}"]`;
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      el.setAttribute('data-bookmarked', 'true');
    });
  });
  
  console.log('[StudentLayerController] Applied bookmarks for current student');
}

/**
 * Regeneriert die komplette Präsentation für aktuellen Schüler
 */
export async function reloadPresentationForStudent() {
  const student = getCurrentStudent();
  
  if (!student) {
    console.error('[StudentLayerController] No current student');
    return;
  }
  
  console.log('[StudentLayerController] Regenerating presentation for student:', student.name);
  
  try {
    const contentData = getContentData();
    
    if (!contentData) {
      console.error('[StudentLayerController] No content data available');
      return;
    }
    
    // Generiere neues HTML basierend auf Student-Config
    const html = generateCompleteSlidesHTML(
      student.topicCount,
      contentData.title || 'Präsentation',
      contentData.subtitle || '',
      contentData.author || 'Autor'
    );
    
    // Aktualisiere Slides-Container
    const slidesContainer = document.querySelector('.reveal .slides');
    if (slidesContainer) {
      slidesContainer.innerHTML = html;
      
      // Reload Reveal.js (ohne Overlay zu schließen)
      if (typeof Reveal !== 'undefined') {
        // Verwende setTimeout um sicherzustellen, dass DOM-Updates abgeschlossen sind
        setTimeout(() => {
          Reveal.sync();
          Reveal.slide(0); // Zurück zur Übersicht
          
          // Re-initialize circle navigation and nav boxes
          if (window.setupCircleNavigation) {
            window.setupCircleNavigation();
          }
          if (window.setupNavigationBoxes) {
            window.setupNavigationBoxes();
          }
          
          console.log('[StudentLayerController] Navigation re-initialized');
        }, 100);
      }
      
      console.log('[StudentLayerController] Presentation reloaded with', student.topicCount, 'circles');
    }
    
    // Speichere Metadaten
    saveGenerationMetadata(student.topicCount, {
      title: contentData.title,
      author: contentData.author,
      student: student.name,
    });
    
    // Speichere HTML auf Server
    await saveIndexHTML();
    console.log('[StudentLayerController] Presentation saved to server');
    
  } catch (error) {
    console.error('[StudentLayerController] Error reloading presentation:', error);
  }
}

/**
 * Aktualisiert Student-Dropdown-Optionen basierend auf aktuellem State
 * @param {Array} students - Array von Student-Konfigurationen
 */
export function updateStudentDropdown(students) {
  const selector = document.getElementById('student-selector');
  
  if (!selector) {
    console.warn('[StudentLayerController] Student selector element not found');
    return;
  }
  
  // Speichere aktuell selektierten Index
  const currentValue = selector.value;
  
  // Lösche alte Optionen
  selector.innerHTML = '';
  
  // Füge neue Optionen hinzu
  students.forEach((student, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = student.name;
    selector.appendChild(option);
  });
  
  // Stelle vorherigen Wert wieder her oder nutze aktuellen Schüler-Index
  const currentStudentIndex = getCurrentStudentIndex();
  selector.value = currentStudentIndex >= students.length ? 0 : currentStudentIndex;
  
  console.log('[StudentLayerController] Updated dropdown with', students.length, 'students');
}

/**
 * Verstecke oder zeige Student-Dropdown basierend auf Layer-Modus
 */
export function toggleStudentDropdownVisibility() {
  const selectorWrapper = document.getElementById('student-selector-wrapper');
  
  if (!selectorWrapper) {
    console.warn('[StudentLayerController] Student selector wrapper not found');
    return;
  }
  
  const isVisible = isLayerModeEnabled();
  
  if (isVisible) {
    selectorWrapper.style.display = 'block';
  } else {
    selectorWrapper.style.display = 'none';
  }
  
  console.log('[StudentLayerController] Dropdown visibility:', isVisible);
}
