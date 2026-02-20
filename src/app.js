import { REVEAL, DEBUG } from '../js/config/index.js';
import { initializeReveal } from './reveal/adapter.js';

// Core modules
import { loadContent } from '../js/modules/storage.js';
import { initMenu } from '../js/modules/menu.js';
import { initNavigation } from '../js/modules/navigation.js';
import { initViewportController } from '../js/modules/viewport-controller.js';
import { initEditMode } from '../js/modules/edit-mode.js';
import { initStudentManager } from '../js/modules/student-manager.js';

async function startApp() {
  // Initialisiere Student Manager FIRST (bevor Content geladen wird)
  try {
    console.log('[App] About to call initStudentManager...');
    initStudentManager();
    console.log('[App] initStudentManager completed successfully');
  } catch (error) {
    console.error('[App] initStudentManager failed:', error);
  }
  
  await loadContent();
  initViewportController();
  initMenu();
  initNavigation();
  
  // Initialize Student Layer Controller (mit Error Handling)
  try {
    const { initStudentLayerController, toggleStudentDropdownVisibility, updateStudentDropdown, reloadPresentationForStudent } = 
      await import('../js/modules/student-layer-controller.js');
    const { getAllStudents, isLayerModeEnabled, getCurrentStudent } = await import('../js/modules/student-manager.js');
    
    initStudentLayerController();
    toggleStudentDropdownVisibility();
    
    const students = getAllStudents();
    if (students.length > 0) {
      updateStudentDropdown(students);
      
      // Reload presentation for current student if layer mode is active
      if (isLayerModeEnabled()) {
        const currentStudent = getCurrentStudent();
        if (currentStudent) {
          console.log('[App] Reloading presentation for student:', currentStudent.name);
          await reloadPresentationForStudent();
        }
      }
    }
  } catch (error) {
    console.warn('[App] Student layer controller error:', error);
  }
  
  // Initialize unified Edit Mode
  initEditMode();
  
  console.log('[App] Core modules initialized');
}

export async function bootstrapApp() {
  try {
    await initializeReveal(REVEAL);
    await startApp();
  } catch (error) {
    console.error('[App] Boot failed:', error);
    if (DEBUG) {
      alert(`Boot failed: ${error?.message || error}`);
    }
    // Fallback: make slides visible so user is not left with blank screen
    const slides = document.querySelector('.reveal .slides');
    if (slides) {
      slides.style.visibility = 'visible';
    }
  }
}

function onDomReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

// Auto-start to mirror previous inline bootstrap
onDomReady(bootstrapApp);