/**
 * Admin Module
 * Handhabt Admin-Modus für Content-Editing
 * 
 * DEPRECATED: Use initEditMode() from edit-mode.js instead
 * This module is kept for backwards compatibility only
 */

import { setEditMode, refreshSubtopics } from './menu.js';
import { saveContent, importContent, handleFileInputChange, getContentData, updateContentData } from './storage.js';
import { normalizeSubtopic } from './utils/normalize.js';

/**
 * Initialisiert Admin-Modus
 * Prüft URL-Parameter und richtet Event-Listener ein
 */
export function initAdmin() {
    // Prüfe URL-Parameter
    const urlParams = new URLSearchParams(window.location.search);
    const adminMode = urlParams.get('mode') === 'admin';
    
    if (adminMode) {
        activateAdminMode();
    }
    
    // Event-Listener für Admin-Controls
    setupAdminControls();
    setupChildEditor();
    setupSizeControls();
    
    // Keyboard-Shortcut: Ctrl+E für Admin-Modus Toggle
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'e') {
            event.preventDefault();
            toggleAdminMode();
        }
    });
    
    console.log('Admin module initialized');
}

/**
 * Richtet Event-Listener für Admin-Controls ein
 */
function setupAdminControls() {
    // Export Button
    const exportBtn = document.getElementById('export-content-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }
    
    // Import Button
    const importBtn = document.getElementById('import-content-btn');
    if (importBtn) {
        importBtn.addEventListener('click', handleImport);
    }
    
    // Close Admin Panel Button
    const closeBtn = document.getElementById('close-admin-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideAdminOverlay();
        });
    }
    
    // File Input (Fallback für Import)
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileInputChange);
    }
}

/**
 * Aktiviert Admin-Modus
 */
function activateAdminMode() {
    adminModeActive = true;
    
    // Aktiviere Edit-Modus für Menü-Kacheln
    setEditMode(true);
    
    // Zeige Admin-Overlay
    showAdminOverlay();
    
    // Aktiviere contenteditable für weitere Elemente
    enableContentEditing();
    setupChildEditor();
    setupSizeControls();
    
    // Visuelle Kennzeichnung
    document.body.classList.add('admin-mode');
    
    console.log('Admin mode activated');
}

/**
 * Deaktiviert Admin-Modus
 */
function deactivateAdminMode() {
    adminModeActive = false;
    
    // Deaktiviere Edit-Modus
    setEditMode(false);
    
    // Verstecke Admin-Overlay
    hideAdminOverlay();
    
    // Deaktiviere contenteditable
    disableContentEditing();
    
    // Entferne visuelle Kennzeichnung
    document.body.classList.remove('admin-mode');
    
    // Sammle geänderte Daten
    collectChanges();
    
    console.log('Admin mode deactivated');
}

/**
 * Toggle Admin-Modus
 */
function toggleAdminMode() {
    if (adminModeActive) {
        deactivateAdminMode();
    } else {
        activateAdminMode();
    }
}

/**
 * Zeigt Admin-Overlay
 */
function showAdminOverlay() {
    const overlay = document.getElementById('admin-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('is-active');
    }
}

/**
 * Versteckt Admin-Overlay
 */
function hideAdminOverlay() {
    const overlay = document.getElementById('admin-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('is-active');
    }
}

/**
 * Aktiviert Content-Editing für verschiedene Elemente
 */
function enableContentEditing() {
    // Titel und Untertitel auf Intro-Slide
    const editableElements = [
        'presentation-title',
        'presentation-subtitle',
        'presentation-author',
        'closing-message'
    ];
    
    editableElements.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.contentEditable = true;
            elem.classList.add('editable');
        }
    });
    
    // Topic-Titel und Content
    const topicTitles = document.querySelectorAll('.topic-title');
    const topicContents = document.querySelectorAll('.topic-content');
    
    topicTitles.forEach(elem => {
        elem.contentEditable = true;
        elem.classList.add('editable');
    });
    
    topicContents.forEach(elem => {
        elem.contentEditable = true;
        elem.classList.add('editable');
    });
}

/**
 * Deaktiviert Content-Editing
 */
function disableContentEditing() {
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(elem => {
        elem.contentEditable = false;
        elem.classList.remove('editable');
    });
}

/**
 * Sammelt alle Änderungen aus editierten Elementen
 */
function collectChanges() {
    const contentData = getContentData();
    if (!contentData) return;
    
    // Aktualisiere Hauptdaten
    const titleElem = document.getElementById('presentation-title');
    const subtitleElem = document.getElementById('presentation-subtitle');
    const authorElem = document.getElementById('presentation-author');
    const closingElem = document.getElementById('closing-message');
    
    if (titleElem) contentData.title = titleElem.textContent;
    if (subtitleElem) contentData.subtitle = subtitleElem.textContent;
    if (authorElem) contentData.author = authorElem.textContent;
    if (closingElem) contentData.closingMessage = closingElem.textContent;
    
    // Aktualisiere Topic-Daten aus Menü-Kacheln
    const tiles = document.querySelectorAll('.menu-tile');
    tiles.forEach(tile => {
        const topicId = parseInt(tile.dataset.topicId);
        const titleElem = tile.querySelector('.tile-title');
        
        if (titleElem && contentData.topics) {
            const topic = contentData.topics.find(t => t.id === topicId);
            if (topic) {
                topic.title = titleElem.textContent;
            }
        }
    });
    
    // Aktualisiere Content-Daten
    updateContentData(contentData);
    
    console.log('Changes collected', contentData);
}

function setupChildEditor() {
    topicSelectEl = document.getElementById('admin-topic-select');
    childListEl = document.getElementById('admin-child-list');
    addChildBtn = document.getElementById('admin-add-child-btn');
    childSizeInput = document.getElementById('admin-child-size');
    childSizeValue = document.getElementById('admin-child-size-value');

    const data = getContentData();
    if (!topicSelectEl || !childListEl || !addChildBtn || !data || !data.topics) {
        return;
    }

    renderTopicOptions(data.topics);

    if (!childEditorBound) {
        topicSelectEl.addEventListener('change', () => {
            const topicId = parseInt(topicSelectEl.value, 10);
            renderChildList(topicId);
        });

        addChildBtn.addEventListener('click', () => {
            const topicId = parseInt(topicSelectEl.value, 10);
            addSubtopic(topicId);
        });

        childEditorBound = true;
    }

    const initialId = parseInt(topicSelectEl.value || data.topics[0]?.id, 10);
    if (!Number.isNaN(initialId)) {
        renderChildList(initialId);
    }
}

function setupSizeControls() {
    if (!childSizeInput || !childSizeValue) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const idleSize = parseInt(rootStyles.getPropertyValue('--childnode-size-idle')) || 60;
    childSizeInput.value = idleSize;
    childSizeValue.textContent = `${idleSize}px`;

    childSizeInput.addEventListener('input', () => {
        const size = parseInt(childSizeInput.value, 10);
        applyChildSize(size);
    });
}

function applyChildSize(sizePx) {
    const root = document.documentElement;
    const focusSize = Math.round(sizePx * 1.6);
    root.style.setProperty('--childnode-size-idle', `${sizePx}px`);
    root.style.setProperty('--childnode-size-focus', `${focusSize}px`);
    if (childSizeValue) childSizeValue.textContent = `${sizePx}px / ${focusSize}px`;

    refreshSubtopicsAll();
}

function renderTopicOptions(topics) {
    if (!topicSelectEl) return;
    topicSelectEl.innerHTML = '';

    topics.forEach((topic) => {
        const option = document.createElement('option');
        option.value = topic.id;
        option.textContent = topic.title || `Thema ${topic.id}`;
        topicSelectEl.appendChild(option);
    });
}

function renderChildList(topicId) {
    if (!childListEl) return;
    const data = getContentData();
    const topic = data?.topics?.find(t => t.id === topicId);

    childListEl.innerHTML = '';
    if (!topic) return;

    const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics.map(normalizeSubtopic) : [];
    topic.subtopics = subtopics;

    subtopics.forEach((entry, index) => {
        const row = document.createElement('div');
        row.className = 'admin-child-row';
        row.dataset.index = index;
        row.draggable = true;

        const handle = document.createElement('span');
        handle.className = 'admin-drag-handle';
        handle.textContent = '⋮⋮';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = entry.title;
        input.placeholder = 'Subtopic';
        input.addEventListener('input', () => updateSubtopicValue(topicId, index, input.value));

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'admin-remove-child';
        removeBtn.textContent = 'Entfernen';
        removeBtn.addEventListener('click', () => removeSubtopic(topicId, index));

        row.addEventListener('dragstart', (e) => startDrag(e, index));
        row.addEventListener('dragover', (e) => onDragOver(e));
        row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
        row.addEventListener('drop', (e) => onDrop(e, topicId, index));

        row.appendChild(handle);
        row.appendChild(input);
        row.appendChild(removeBtn);
        childListEl.appendChild(row);
    });

    updateAddButtonState(subtopics.length);
}

function updateAddButtonState(count) {
    if (!addChildBtn) return;
    addChildBtn.disabled = count >= MAX_SUBTOPICS;
}

function addSubtopic(topicId) {
    const data = getContentData();
    if (!data?.topics) return;

    const topic = data.topics.find(t => t.id === topicId);
    if (!topic) return;

    topic.subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
    if (topic.subtopics.length >= MAX_SUBTOPICS) return;

    topic.subtopics.push({ title: 'Neues Subtopic', position: null });
    updateContentData(data);
    renderChildList(topicId);
    refreshSubtopics(topicId);
}

function reorderSubtopics(topicId, fromIndex, toIndex) {
    const data = getContentData();
    if (!data?.topics) return;

    const topic = data.topics.find(t => t.id === topicId);
    if (!topic || !Array.isArray(topic.subtopics)) return;
    topic.subtopics = topic.subtopics.map(normalizeSubtopic);

    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 ||
        fromIndex >= topic.subtopics.length || toIndex >= topic.subtopics.length) {
        return;
    }

    const [moved] = topic.subtopics.splice(fromIndex, 1);
    topic.subtopics.splice(toIndex, 0, moved);

    updateContentData(data);
    renderChildList(topicId);
    refreshSubtopics(topicId);
}

function startDrag(event, index) {
    dragSourceIndex = index;
    event.dataTransfer.effectAllowed = 'move';
}

function onDragOver(event) {
    event.preventDefault();
    const row = event.currentTarget;
    row.classList.add('drag-over');
}

function onDrop(event, topicId, targetIndex) {
    event.preventDefault();
    const row = event.currentTarget;
    row.classList.remove('drag-over');
    if (dragSourceIndex === null) return;
    reorderSubtopics(topicId, dragSourceIndex, targetIndex);
    dragSourceIndex = null;
}

function removeSubtopic(topicId, index) {
    const data = getContentData();
    if (!data?.topics) return;

    const topic = data.topics.find(t => t.id === topicId);
    if (!topic || !Array.isArray(topic.subtopics)) return;

    topic.subtopics.splice(index, 1);
    updateContentData(data);
    renderChildList(topicId);
    refreshSubtopics(topicId);
}

function updateSubtopicValue(topicId, childIndex, value) {
    const data = getContentData();
    if (!data?.topics) return;

    const topic = data.topics.find(t => t.id === topicId);
    if (!topic) return;

    topic.subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
    const existing = normalizeSubtopic(topic.subtopics[childIndex]);
    topic.subtopics[childIndex] = { ...existing, title: value };

    updateContentData(data);
    refreshSubtopics(topicId);
}

/**
 * Handhabt Export-Button Click
 */
async function handleExport() {
    // Sammle aktuelle Änderungen
    collectChanges();
    
    // Speichere Content
    await saveContent();
}

/**
 * Handhabt Import-Button Click
 */
async function handleImport() {
    await importContent();
}

/**
 * Prüft ob Admin-Modus aktiv ist
 * @returns {boolean} - Admin-Modus Status
 */
export function isAdminMode() {
    return adminModeActive;
}
