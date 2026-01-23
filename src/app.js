import { revealConfig, DEBUG } from './config.js';
import { initializeReveal } from './reveal/adapter.js';

// Core modules
import { loadContent } from '../js/modules/storage.js';
import { initMenu } from '../js/modules/menu.js';
import { initNavigation } from '../js/modules/navigation.js';
import { initViewportController } from '../js/modules/viewport-controller.js';
import { initEditMode } from '../js/modules/edit-mode.js';

async function startApp() {
  await loadContent();
  initViewportController();
  initMenu();
  initNavigation();
  
  // Initialize unified Edit Mode (replaces separate initEditor + initAdmin)
  initEditMode();
  
  console.log('[App] Core modules initialized');
}

export async function bootstrapApp() {
  try {
    await initializeReveal(revealConfig);
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