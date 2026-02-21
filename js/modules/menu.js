/**
 * Menu Module
 * Generiert kreisförmiges Kachel-Menü mit Mindmap-Style Childnode-Tiles
 * Integriert mit Viewport Controller für Zoom-Animation
 * 
 * RESPONSIVE LAYOUT SYSTEM:
 * - computeLayout() berechnet alle Werte basierend auf Viewport
 * - computeMindmapLayout() positioniert Childnode-Tiles um Parent
 * - CSS Custom Properties steuern Layout
 * - Automatische Anpassung bei Resize
 * 
 * MINDMAP FEATURES:
 * - Childnode-Tiles als Satelliten um Parent-Tile
 * - SVG Bézier-Linien als Verbindungen
 * - Bookmark-Persistenz via localStorage
 */

import { getViewportController, computeMindmapLayout } from './viewport-controller.js';
import { getBookmarks, toggleBookmarkStorage } from './storage.js';
import { normalizeSubtopic, normalizeTopic } from './utils/normalize.js';
import { computeLayout, applyLayoutToCSS, updateTilePositions, updateLayout } from './menu-layout.js';
import { debounce } from './utils/math.js';
import { showSubtopicDetail, closeSubtopicDetail } from './subtopic-detail.js';

let contentData = null;
let layoutCache = null;
let resizeTimeout = null;
let dragContext = null;
let lastDragPoint = null;

/**
 * Resize Handler mit Debouncing
 */
function handleResize() {
    // Debounce: Warte bis Resize "fertig" ist
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    
    resizeTimeout = setTimeout(() => {
        updateLayout();
        // Nach Layout-Update: Childnode-Positionen aktualisieren
        positionChildnodeTiles();
    }, 100); // 100ms Debounce
}

/**
 * Setzt Content-Daten für das Menü
 * @param {Object} data - Geladene Content-Daten aus JSON
 */
export function setContentData(data) {
    if (data?.topics) {
        data.topics = data.topics.map(normalizeTopic);
    }
    contentData = data;
}

/**
 * Initialisiert das kreisförmige Menü mit Childnode-Labels
 * Berechnet Positionen der Kacheln im Kreis und rendert sie
 */
export function initMenu() {
    console.log('[Menu] initMenu called, contentData:', contentData);
    
    if (!contentData || !contentData.topics) {
        console.warn('[Menu] Content data not loaded yet');
        return;
    }

    const container = document.getElementById('tile-container');
    console.log('[Menu] tile-container:', container);
    if (!container) {
        console.error('[Menu] tile-container not found!');
        return;
    }

    container.addEventListener('dragover', onContainerDragOver);
    container.addEventListener('drop', onContainerDrop);

    // Lösche vorhandene Kacheln
    container.innerHTML = '';

    const topics = contentData.topics;
    const tileCount = topics.length;
    
    // ===================================
    // RESPONSIVE LAYOUT BERECHNUNG
    // Ersetzt fixe Werte durch computeLayout
    // ===================================
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    
    // Berechne initiales Layout
    layoutCache = computeLayout(viewportW, viewportH, tileCount);
    
    // Wende Layout-CSS-Vars an
    applyLayoutToCSS(layoutCache);
    
    const { radius, tileSize, centerX, centerY, aspectStretchX, aspectStretchY } = layoutCache;
    const halfTile = tileSize / 2;
    
    // Positioniere zentralen Kreis (falls vorhanden)
    const centerCircle = container.querySelector('.center-circle') || container.querySelector('.spiral-center');
    if (centerCircle) {
      const centerCircleSize = tileSize * 1.2;
      centerCircle.style.left = `${centerX - centerCircleSize / 2}px`;
      centerCircle.style.top = `${centerY - centerCircleSize / 2}px`;
      centerCircle.style.width = `${centerCircleSize}px`;
      centerCircle.style.height = `${centerCircleSize}px`;
    }

    topics.forEach((topic, index) => {
        // Berechne Position im Kreis (mit Aspect-Stretch für Ellipse)
        // Startwinkel bei -90° (oben), dann gleichmäßig verteilt
        const angle = (index / tileCount) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * aspectStretchX * Math.cos(angle);
        const y = centerY + radius * aspectStretchY * Math.sin(angle);

        // Erstelle Kachel-Element
        const tile = document.createElement('div');
        tile.className = 'menu-tile';
        tile.dataset.topicId = topic.id;
        tile.dataset.color = topic.color;
        tile.style.setProperty('--tile-color', topic.color);
        
        // Positioniere Kachel (zentriert auf berechneter Position)
        tile.style.left = `${x - halfTile}px`;
        tile.style.top = `${y - halfTile}px`;

        // Titel-Element
        const titleElem = document.createElement('div');
        titleElem.className = 'tile-title';
        titleElem.textContent = topic.title;
        titleElem.contentEditable = false;
        
        tile.appendChild(titleElem);

        buildChildTiles(tile, topic);

        // Click-Handler für Zoom-Animation
        tile.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const viewportController = getViewportController();
            
            console.log(`[Menu] Tile ${topic.id} clicked, starting zoom animation`);
            viewportController.focusTile(topic.id, tile);
        });

        container.appendChild(tile);
    });

    // ===================================
    // MINDMAP LAYOUT INITIALISIERUNG
    // Positioniere Childnode-Tiles nach DOM-Rendering
    // ===================================
    // Warte auf nächsten Frame damit Layout-Berechnungen korrekt sind
    requestAnimationFrame(() => {
        positionChildnodeTiles();
        restoreBookmarks();
        
        // Setze initiale Mindmap-State-Klasse
        const tileContainer = document.getElementById('tile-container');
        if (tileContainer) {
            tileContainer.classList.add('mindmap-idle');
        }
    });

    // ===================================
    // RESIZE HANDLER REGISTRIEREN
    // Aktualisiert Layout bei Viewport-Änderung
    // ===================================
    window.addEventListener('resize', handleResize);

    // Listen zu Viewport-Controller State Changes
    const viewportController = getViewportController();
    viewportController.onStateChange((newState) => {
        updateTileVisibilityByState(newState);
        updateMindmapStateClass(newState);
    });
    
    // Setup Detail-Panel Activation via Animation Events
    setupDetailPanelListeners();
    
    // Setup Zurück-Button Handler in Detail-Panels
    setupReturnButtonHandlers();

    console.log(`[Menu] Initialized with ${tileCount} tiles | Layout: ${layoutCache.debug.config} [${layoutCache.debug.mode}]`);
}

/**
 * Update Mindmap State Class auf tile-container
 * Steuert CSS-Transitions für idle/hover/focused
 * @param {string} state - Neuer State (idle, focusing, focused, returning)
 */
function updateMindmapStateClass(state) {
    const tileContainer = document.getElementById('tile-container');
    if (!tileContainer) return;
    
    // Entferne alle State-Klassen
    tileContainer.classList.remove('mindmap-idle', 'mindmap-hover', 'mindmap-focused');
    
    // Setze neue State-Klasse
    if (state === 'idle') {
        tileContainer.classList.add('mindmap-idle');
    } else if (state === 'focusing' || state === 'focused') {
        tileContainer.classList.add('mindmap-focused');
    }
    // 'returning' behält focused-Klasse bis idle erreicht
}

/**
 * Update tile visibility based on viewport state
 * Im focused/focusing state: fokussierte Tile hervorgehoben, andere zurückgesetzt
 * Im idle state: alle Tiles normal sichtbar
 */
function updateTileVisibilityByState(state) {
    const viewportController = getViewportController();
    const tiles = document.querySelectorAll('.menu-tile');
    const focusedId = viewportController.getFocusedTileId();

    tiles.forEach(tile => {
        const tileId = parseInt(tile.dataset.topicId);
        
        if (state === 'idle') {
            // Alle Tiles zurück auf "nicht fokussiert"
            // Kein data-focused Attribut = normale Darstellung
            delete tile.dataset.focused;
        } else if (state === 'focusing' || state === 'focused' || state === 'returning') {
            // Markiere fokussierte vs. unfokussierte Tiles
            tile.dataset.focused = tileId === focusedId ? 'true' : 'false';
        }
    });
}

/**
 * Setup Animation Event Listeners für Viewport-Zustand
 * Setzt .focused Klasse auf camera-viewport für CSS-Steuerung
 * KEIN separates Detail-Panel mehr - alles in den Tiles
 */
function setupDetailPanelListeners() {
    const viewportController = getViewportController();
    const cameraViewport = document.querySelector('.camera-viewport');
    
    if (!cameraViewport) {
        console.warn('[Menu] camera-viewport not found');
        return;
    }
    
    viewportController.onAnimationEvent((event) => {
        if (event.type === 'start' && event.animation === 'zoom-in') {
            // Zoom startet: Viewport in Fokus-Modus
            cameraViewport.classList.add('focused');
            console.log('[Menu] Camera viewport entering focused mode');
        } else if (event.type === 'end' && event.animation === 'zoom-out') {
            // Zoom-Out beendet: Viewport zurück in idle
            cameraViewport.classList.remove('focused');
            console.log('[Menu] Camera viewport returned to idle');
        }
    });
}

/**
 * Setup Zurück-Button Handler
 * Global Return Button mit data-action="unfocus" löst viewportController.unfocus() aus
 */
function setupReturnButtonHandlers() {
    // Global Return Button (nicht mehr in Detail-Panels)
    const globalReturnBtn = document.querySelector('.global-return-btn[data-action="unfocus"]');
    
    if (globalReturnBtn) {
        globalReturnBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const viewportController = getViewportController();
            console.log('[Menu] Global return button clicked, triggering unfocus');
            viewportController.unfocus();
        });
        console.log('[Menu] Global return button handler attached');
    }
}

/**
 * Aktualisiert Kachel-Titel (für Admin-Modus)
 * @param {number} topicId - Topic ID
 * @param {string} newTitle - Neuer Titel
 */
export function updateTileTitle(topicId, newTitle) {
    const tile = document.querySelector(`.menu-tile[data-topic-id="${topicId}"]`);
    if (tile) {
        const titleElem = tile.querySelector('.tile-title');
        if (titleElem) {
            titleElem.textContent = newTitle;
        }
    }
}

/**
 * Aktiviert/Deaktiviert Editier-Modus für Kacheln
 * @param {boolean} enabled - Ob Editier-Modus aktiv sein soll
 */
export function setEditMode(enabled) {
    const tiles = document.querySelectorAll('.tile-title');
    tiles.forEach(tile => {
        tile.contentEditable = enabled;
    });

    // Füge/Entferne Admin-Klasse für visuelle Kennzeichnung
    const container = document.querySelector('.circular-menu');
    if (container) {
        if (enabled) {
            container.classList.add('admin-mode');
        } else {
            container.classList.remove('admin-mode');
        }
    }
}

function buildChildTiles(tile, topic) {
    normalizeTopic(topic);
    tile.querySelectorAll('.childnode-tile').forEach(node => node.remove());

    if (!topic.subtopics || !Array.isArray(topic.subtopics)) return;

    const maxChildren = Math.min(topic.subtopics.length, 6);

    topic.subtopics.slice(0, maxChildren).forEach((subtopic, subIndex) => {
        const childTile = createChildTile(topic, subIndex, subtopic);
        tile.appendChild(childTile);
    });
}

function createChildTile(topic, subIndex, subtopic) {
    const childTile = document.createElement('div');
    childTile.className = 'childnode-tile';
    childTile.dataset.parentId = topic.id;
    childTile.dataset.childIndex = subIndex;
    childTile.draggable = true;

    const childTitle = document.createElement('span');
    childTitle.className = 'childnode-title';
    childTitle.textContent = subtopic?.title ?? subtopic ?? '';
    childTile.appendChild(childTitle);

    const bookmarkBtn = document.createElement('button');
    bookmarkBtn.className = 'bookmark-toggle';
    bookmarkBtn.setAttribute('aria-label', 'Lesezeichen setzen');
    bookmarkBtn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
    `;
    childTile.appendChild(bookmarkBtn);

    bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmark(topic.id, subIndex, childTile);
    });

    childTile.addEventListener('click', (e) => {
        e.stopPropagation();
        handleChildnodeClick(topic.id, subIndex, subtopic?.title ?? subtopic);
    });

    childTile.addEventListener('dragstart', (e) => onChildDragStart(e, topic.id, subIndex));
    childTile.addEventListener('dragover', (e) => onChildDragOver(e, topic.id));
    childTile.addEventListener('dragleave', (e) => onChildDragLeave(e));
    childTile.addEventListener('drop', (e) => onChildDrop(e, topic.id, subIndex));
    childTile.addEventListener('dragend', onChildDragEnd);

    return childTile;
}

function onChildDragStart(event, parentId, childIndex) {
    if (!document.body.classList.contains('admin-mode')) return;
    event.stopPropagation();
    dragContext = { parentId, childIndex };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'childnode');
    event.currentTarget.classList.add('dragging');
}

function onChildDragOver(event, parentId) {
    if (!document.body.classList.contains('admin-mode')) return;
    if (!dragContext || dragContext.parentId !== parentId) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    if (dragContext.childIndex !== parseInt(event.currentTarget.dataset.childIndex, 10)) {
        event.currentTarget.classList.add('drag-over');
    }
}

function onChildDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function onChildDrop(event, parentId, targetIndex) {
    if (!document.body.classList.contains('admin-mode')) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
    if (!dragContext || dragContext.parentId !== parentId) return;

    const fromIndex = dragContext.childIndex;
    dragContext = null;

    const draggingTile = document.querySelector('.childnode-tile.dragging');
    if (draggingTile) draggingTile.classList.remove('dragging');

    const parentTile = document.querySelector(`.menu-tile[data-topic-id="${parentId}"]`);
    if (parentTile) {
        const pos = computeRelativePosition(event, parentTile);
        setSubtopicPosition(parentId, fromIndex, pos);
    }

    reorderSubtopicsInData(parentId, fromIndex, targetIndex);
}

function onChildDragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    event.currentTarget.classList.remove('drag-over');
    dragContext = null;
}

function computeRelativePosition(event, parentTile) {
    const parentRect = parentTile.getBoundingClientRect();
    const centerX = parentRect.left + parentRect.width / 2;
    const centerY = parentRect.top + parentRect.height / 2;
    const relX = ((event.clientX - centerX) / parentRect.width) * 100;
    const relY = ((event.clientY - centerY) / parentRect.height) * 100;
    return {
        x: Math.max(-200, Math.min(200, relX)),
        y: Math.max(-200, Math.min(200, relY))
    };
}

function setSubtopicPosition(parentId, childIndex, position) {
    if (!contentData?.topics) return;
    const topic = contentData.topics.find(t => t.id === parentId);
    if (!topic || !Array.isArray(topic.subtopics)) return;
    normalizeTopic(topic);
    const target = topic.subtopics[childIndex];
    if (!target) return;
    target.position = position;
}

function onContainerDragOver(event) {
    if (!document.body.classList.contains('admin-mode')) return;
    if (!dragContext) return;
    event.preventDefault();
    lastDragPoint = { x: event.clientX, y: event.clientY };
}

function onContainerDrop(event) {
    if (!document.body.classList.contains('admin-mode')) return;
    if (!dragContext) return;
    event.preventDefault();
    event.stopPropagation();

    const { parentId, childIndex } = dragContext;
    dragContext = null;

    const parentTile = document.querySelector(`.menu-tile[data-topic-id="${parentId}"]`);
    const draggingTile = document.querySelector('.childnode-tile.dragging');
    if (draggingTile) draggingTile.classList.remove('dragging');

    if (!parentTile) return;

    const pos = computeRelativePosition(event, parentTile);
    setSubtopicPosition(parentId, childIndex, pos);
    refreshSubtopics(parentId);
}

function reorderSubtopicsInData(parentId, fromIndex, toIndex) {
    if (!contentData?.topics) return;
    const topic = contentData.topics.find(t => t.id === parentId);
    if (!topic || !Array.isArray(topic.subtopics)) return;
    normalizeTopic(topic);
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= topic.subtopics.length || toIndex >= topic.subtopics.length) return;

    const [moved] = topic.subtopics.splice(fromIndex, 1);
    topic.subtopics.splice(toIndex, 0, moved);

    refreshSubtopics(parentId);

    const detail = { parentId, subtopics: topic.subtopics.slice() };
    document.dispatchEvent(new CustomEvent('childnodes:reordered', { detail }));
}

/**
 * Hilfsfunktion: Konvertiere Hex-Farbe zu RGB
 * @param {string} hex - Hex-Farbe (#RRGGBB)
 * @returns {Array} [R, G, B]
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

/**
 * ===================================
 * MINDMAP CHILDNODE MANAGEMENT
 * Positionierung, Linien, Interaktion
 * ===================================
 */

/**
 * Positioniert alle Childnode-Tiles um ihre Parent-Tiles
 * Wird nach initMenu() und bei Resize aufgerufen
 */
export function refreshSubtopics(topicId) {
    if (!contentData?.topics) return;

    const tile = document.querySelector(`.menu-tile[data-topic-id="${topicId}"]`);
    const topic = contentData.topics.find(t => t.id === topicId);

    if (!tile || !topic) return;

    buildChildTiles(tile, topic);

    requestAnimationFrame(() => {
        positionChildnodeTiles();
        restoreBookmarks();
    });
}

export function refreshSubtopicsAll() {
    if (!contentData?.topics) return;
    contentData.topics.forEach(topic => {
        refreshSubtopics(topic.id);
    });
}

export function positionChildnodeTiles() {
    const tiles = document.querySelectorAll('.menu-tile');
    const tileContainer = document.getElementById('tile-container');
    const viewportRect = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    
    tiles.forEach(tile => {
        const childnodes = tile.querySelectorAll('.childnode-tile');
        if (childnodes.length === 0) return;
        
        // Parent-Tile Bounding Box relativ zum Container
        const tileRect = tile.getBoundingClientRect();
        const containerRect = tileContainer.getBoundingClientRect();
        
        const parentRect = {
            x: tileRect.left - containerRect.left + tileRect.width / 2,
            y: tileRect.top - containerRect.top + tileRect.height / 2,
            width: tileRect.width,
            height: tileRect.height
        };
        
        // Berechne Mindmap-Layout für Childnodes
        const defaultPositions = computeMindmapLayout(
            parentRect,
            childnodes.length,
            viewportRect,
            'ring' // Default: Ring-Anordnung
        );

        const topicId = Number(tile.dataset.topicId);
        const topic = contentData?.topics?.find(t => t.id === topicId);

        const positions = Array.from({ length: childnodes.length }, (_, index) => {
            const sub = topic?.subtopics?.[index];
            const pos = sub?.position;
            if (pos && isFinite(pos.x) && isFinite(pos.y)) {
                return {
                    x: pos.x,
                    y: pos.y,
                    angle: Math.atan2(pos.y, pos.x)
                };
            }
            return defaultPositions[index];
        });

        // Wende Positionen auf Childnodes an
        childnodes.forEach((child, index) => {
            if (positions[index]) {
                const pos = positions[index];
                // Position relativ zum Parent-Tile-Zentrum
                child.style.left = `${50 + pos.x}%`;
                child.style.top = `${50 + pos.y}%`;
                // Speichere Winkel für potentielle Animationen
                child.dataset.angle = pos.angle;
            }
        });
        
            // Lines disabled
    });
}

/**
 * Toggle Bookmark für einen Childnode
 * @param {number} parentId - Parent Topic ID
 * @param {number} childIndex - Index des Childnodes
 * @param {HTMLElement} childTile - Das Childnode-Tile-Element
 */
function toggleBookmark(parentId, childIndex, childTile) {
    const isBookmarked = toggleBookmarkStorage(parentId, childIndex);
    
    if (isBookmarked) {
        childTile.classList.add('bookmarked');
        console.log(`[Menu] Bookmark added: Topic ${parentId}, Child ${childIndex}`);
    } else {
        childTile.classList.remove('bookmarked');
        console.log(`[Menu] Bookmark removed: Topic ${parentId}, Child ${childIndex}`);
    }
}

/**
 * Lädt und wendet gespeicherte Bookmarks an
 */
function restoreBookmarks() {
    const bookmarks = getBookmarks();
    
    bookmarks.forEach(bookmark => {
        const selector = `.childnode-tile[data-parent-id="${bookmark.parentId}"][data-child-index="${bookmark.childIndex}"]`;
        const childTile = document.querySelector(selector);
        if (childTile) {
            childTile.classList.add('bookmarked');
        }
    });
    
    console.log(`[Menu] Restored ${bookmarks.length} bookmarks`);
}

/**
 * Handler für Klick auf Childnode-Tile
 * Navigiert zum entsprechenden Content oder zeigt Detail-Ansicht
 * @param {number} parentId - Parent Topic ID
 * @param {number} childIndex - Index des Childnodes
 * @param {string} subtopicTitle - Titel des Subtopics
 */
function handleChildnodeClick(parentId, childIndex, subtopicTitle) {
    const viewportController = getViewportController();
    const currentState = viewportController.getCurrentState();
    // Nur reagieren wenn im focused State
    if (currentState !== 'focused') {
        console.log(`[Menu] Childnode click ignored - not in focused state (${currentState})`);
        return;
    }
    
    console.log(`[Menu] Childnode clicked: Topic ${parentId}, Child ${childIndex} - "${subtopicTitle}"`);
    
    // Navigate to subtopic detail content
    showSubtopicDetail(parentId, childIndex, subtopicTitle);
}

/**
 * Aktualisiert Childnode-Positionen bei Resize
 * Wird vom resize handler aufgerufen
 */
function updateChildnodePositionsOnResize() {
    // Debounced durch handleResize
    positionChildnodeTiles();
}
