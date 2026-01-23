/**
 * Navigation Module
 * Handhabt Tastatur-Navigation, Escape-Taste, und Back-Button
 */

import { getViewportController } from './viewport-controller.js';

export function initNavigation() {
    // Keyboard Event Handler
    document.addEventListener('keydown', (e) => {
        handleKeyboardNavigation(e);
    });

    // Event-Handler für "Buch schließen" Button (bestehende Funktionalität)
    const closeBookBtn = document.getElementById('close-book-btn');
    if (closeBookBtn) {
        closeBookBtn.addEventListener('click', closeBook);
    }

    console.log('[Navigation] Module initialized');
}

/**
 * Handle Keyboard Navigation
 * Im fokussierten Zustand: ESC löst unfocus aus
 * Im idle Zustand: normale Reveal.js Navigation (außer bei Fokus)
 * @param {KeyboardEvent} e
 */
function handleKeyboardNavigation(e) {
    const viewportController = getViewportController();
    const currentState = viewportController.getCurrentState();

    // Escape: Unfocus wenn fokussiert, sonst ignorieren
    if (e.key === 'Escape') {
        if (currentState === 'focused') {
            e.preventDefault();
            console.log('[Navigation] ESC pressed, triggering unfocus');
            viewportController.unfocus();
        }
        // Im idle-State: ESC macht nichts (kein Slide-Wechsel nötig)
        return;
    }

    // Während Animation oder Fokus: Keine Navigation
    if (currentState !== 'idle') {
        // Keyboard ist ohnehin durch ViewportController gesperrt
        return;
    }

    // H oder Home: Zurück zum Menü (wenn nicht bereits dort)
    if (e.key === 'h' || e.key === 'H' || e.key === 'Home') {
        if (!e.ctrlKey && !e.altKey) {
            const currentSlide = Reveal.getState().indexh;
            // Slide 1 ist das Hauptmenü
            if (currentSlide !== 1) {
                e.preventDefault();
                returnToMainMenu();
            }
        }
    }
    
    // 'End' - zur Closing-Slide springen
    if (e.key === 'End') {
        if (!e.ctrlKey && !e.altKey) {
            e.preventDefault();
            goToClosing();
        }
    }
}

/**
 * Handle Back Action
 * NEUE LOGIK: Nur unfocus wenn fokussiert, kein Slide-Wechsel
 * Detail-Content wird im selben Slide ein-/ausgeblendet
 */
function handleBackAction() {
    const viewportController = getViewportController();
    const state = viewportController.getCurrentState();

    if (state === 'focused') {
        // Trigger Zoom-Out Animation
        console.log('[Navigation] handleBackAction: triggering unfocus');
        viewportController.unfocus();
    }
    // Im idle-State: nichts tun (User ist bereits im Menü)
}

/**
 * Navigiert zurück zum Hauptmenü
 * NUR für Navigation von Intro/Closing, NICHT für Zurück aus Detail-Panel
 */
export function returnToMainMenu() {
    console.log('[Navigation] Returning to main menu slide');
    Reveal.slide(1, 0);
}

/**
 * Navigiert zur Closing-Slide
 */
function goToClosing() {
    // Closing ist die letzte Horizontal-Slide
    const totalSlides = Reveal.getTotalSlides();
    const horizontalSlides = Reveal.getHorizontalSlides().length;
    
    console.log(`Navigating to closing slide (${horizontalSlides - 1})`);
    Reveal.slide(horizontalSlides - 1, 0);
}

/**
 * Schließt das Buch mit Animation
 */
function closeBook() {
    const bookElement = document.getElementById('closing-book');
    
    if (bookElement) {
        // Füge Closing-Animation Klasse hinzu
        bookElement.classList.add('closing');
        
        // Optional: Verstecke Buttons während der Animation
        const buttonsContainer = document.querySelector('.closing-buttons');
        if (buttonsContainer) {
            buttonsContainer.style.opacity = '0';
            buttonsContainer.style.transition = 'opacity 0.5s ease';
        }
        
        console.log('Book closing animation triggered');
    }
}

/**
 * Öffnet das Buch wieder (reverse Animation)
 * Wird nicht aktiv verwendet, aber für potenzielle Erweiterungen verfügbar
 */
export function reopenBook() {
    const bookElement = document.getElementById('closing-book');
    
    if (bookElement) {
        bookElement.classList.remove('closing');
        
        const buttonsContainer = document.querySelector('.closing-buttons');
        if (buttonsContainer) {
            buttonsContainer.style.opacity = '1';
        }
        
        console.log('Book reopened');
    }
}

/**
 * Exportiere handleBackAction für externe Nutzung (z.B. Buttons)
 */
export { handleBackAction };

/**
 * Navigiert zu einem spezifischen Topic (Legacy/Fallback)
 * HINWEIS: Detail-Content wird jetzt im Menü-Slide eingeblendet,
 * diese Funktion wird nur noch für direkten Slide-Zugriff benötigt
 * @param {number} topicId - Topic ID (1-basiert)
 * @param {number} slideIndex - Vertikale Slide innerhalb des Topics (optional, default 0)
 */
export function navigateToTopic(topicId, slideIndex = 0) {
    // Topic-Slides beginnen bei horizontalem Index 2
    const horizontalIndex = topicId + 1;
    
    console.log(`[Navigation] Navigating to topic ${topicId}, slide ${slideIndex}`);
    Reveal.slide(horizontalIndex, slideIndex);
}
