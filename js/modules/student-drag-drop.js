/**
 * ════════════════════════════════════════════════════════════════════════════
 * STUDENT DRAG-DROP MANAGER - Ermöglicht Umordnung von Schülern
 * ════════════════════════════════════════════════════════════════════════════
 */

import { reorderStudents, getAllStudents } from './student-manager.js';
import { updateStudentDropdown } from './student-layer-controller.js';

let draggedFromIndex = null;

/**
 * Initialisiert Drag-Drop für Student-Liste
 */
export function initStudentDragDrop() {
  console.log('[StudentDragDrop] Initializing...');
  setupDragDropListeners();
}

/**
 * Setzt Drag-Drop-Listener für Student-List-Items ein
 */
function setupDragDropListeners() {
  // Diese Funktion wird aufgerufen, nachdem die Liste im Edit-Mode gerendert wurde
  // Warte kurz, bis DOM aktualisiert ist
  setTimeout(() => {
    attachDragDropToItems();
  }, 100);
}

/**
 * Bindet Drag-Drop-Events an Student-Liste an
 */
function attachDragDropToItems() {
  const listContainer = document.getElementById('student-list-container');
  
  if (!listContainer) {
    console.warn('[StudentDragDrop] Student list container not found');
    return;
  }
  
  const items = listContainer.querySelectorAll('[draggable="true"]');
  
  items.forEach((item, index) => {
    // Drag Start
    item.addEventListener('dragstart', (e) => {
      draggedFromIndex = parseInt(item.getAttribute('data-student-index'));
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      console.log('[StudentDragDrop] Drag started from index:', draggedFromIndex);
    });
    
    // Drag End
    item.addEventListener('dragend', (e) => {
      item.classList.remove('dragging');
      items.forEach((el) => {
        el.classList.remove('drag-over');
      });
      draggedFromIndex = null;
      console.log('[StudentDragDrop] Drag ended');
    });
    
    // Drag Over
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const targetIndex = parseInt(item.getAttribute('data-student-index'));
      
      if (draggedFromIndex !== null && draggedFromIndex !== targetIndex) {
        item.classList.add('drag-over');
      }
    });
    
    // Drag Leave
    item.addEventListener('dragleave', (e) => {
      item.classList.remove('drag-over');
    });
    
    // Drop
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const toIndex = parseInt(item.getAttribute('data-student-index'));
      
      if (draggedFromIndex !== null && draggedFromIndex !== toIndex) {
        console.log('[StudentDragDrop] Dropped from', draggedFromIndex, 'to', toIndex);
        handleStudentReorder(draggedFromIndex, toIndex);
      }
      
      item.classList.remove('drag-over');
      draggedFromIndex = null;
    });
  });
  
  console.log('[StudentDragDrop] Attached drag-drop to', items.length, 'items');
}

/**
 * Behandelt Umordnung von Schülern
 * @param {number} fromIndex - Ausgangsindex
 * @param {number} toIndex - Zielindex
 */
function handleStudentReorder(fromIndex, toIndex) {
  try {
    reorderStudents(fromIndex, toIndex);
    
    // Aktualisiere UI
    const students = getAllStudents();
    updateStudentDropdown(students);
    
    // Render Student List neu
    renderStudentList();
    
    console.log('[StudentDragDrop] Students reordered successfully');
  } catch (error) {
    console.error('[StudentDragDrop] Error reordering students:', error);
  }
}

/**
 * Rendert die Student-Liste im Edit-Mode neu
 * Diese Funktion wird vom Edit-Mode aufgerufen
 */
export function renderStudentList() {
  const listContainer = document.getElementById('student-list-container');
  
  if (!listContainer) {
    console.warn('[StudentDragDrop] Student list container not found');
    return;
  }
  
  const students = getAllStudents();
  
  // Generiere HTML für Student-Liste
  let html = '<div style="margin-top: 20px;">';
  html += '<h4>Schüler (zum Umordnen ziehen):</h4>';
  html += '<div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">';
  
  students.forEach((student, index) => {
    html += `
      <div 
        draggable="true" 
        data-student-index="${index}"
        style="
          padding: 10px 15px;
          border-bottom: 1px solid #eee;
          cursor: move;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9f9f9;
          transition: all 0.2s ease;
        "
        class="student-list-item"
      >
        <span>
          <strong>${index + 1}.</strong> ${student.name} 
          <span style="color: #999; font-size: 12px;">(${student.topicCount} Kreise)</span>
        </span>
        <span style="color: #999; font-size: 12px;">⋮ Ziehen zum Umordnen</span>
      </div>
    `;
  });
  
  html += '</div>';
  html += '<p style="font-size: 12px; color: #999; margin-top: 10px;">Hinweis: Ziehen Sie einen Schüler, um die Reihenfolge zu ändern.</p>';
  html += '</div>';
  
  listContainer.innerHTML = html;
  
  // Re-attach Drag-Drop-Listener
  setTimeout(() => {
    attachDragDropToItems();
  }, 0);
  
  console.log('[StudentDragDrop] Student list rendered with', students.length, 'students');
}
