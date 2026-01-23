/**
 * Storage Module
 * Handhabt Laden und Speichern von Content-Daten
 * Verwendet File System Access API mit Fallback zu Download/Upload
 */

import { setContentData, initMenu } from './menu.js';

let currentFileHandle = null;
let contentData = null;

/**
 * Prüft, ob File System Access API verfügbar ist
 * @returns {boolean} - Verfügbarkeit der API
 */
function isFileSystemAccessSupported() {
    return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

/**
 * Lädt Content-Daten aus JSON-Datei
 * Versucht zuerst lokale Datei zu laden, bei Fehler wird Standard-Content verwendet
 */
export async function loadContent() {
    try {
        const response = await fetch('data/content.json');
        if (!response.ok) {
            throw new Error('Failed to load content.json');
        }
        
        contentData = await response.json();
        
        // Aktualisiere HTML mit geladenen Daten
        updateHTMLContent(contentData);
        
        // Setze Content-Daten für Menü-Modul
        setContentData(contentData);
        
        console.log('Content loaded successfully', contentData);
        return contentData;
        
    } catch (error) {
        console.error('Error loading content:', error);
        
        // Fallback zu Standardwerten aus HTML
        contentData = extractContentFromHTML();
        setContentData(contentData);
        return contentData;
    }
}

/**
 * Aktualisiert HTML-Elemente mit geladenen Daten
 * @param {Object} data - Content-Daten
 */
function updateHTMLContent(data) {
    // Aktualisiere Titel auf Intro-Slide
    const titleElem = document.getElementById('presentation-title');
    const subtitleElem = document.getElementById('presentation-subtitle');
    const authorElem = document.getElementById('presentation-author');
    
    if (titleElem && data.title) titleElem.textContent = data.title;
    if (subtitleElem && data.subtitle) subtitleElem.textContent = data.subtitle;
    if (authorElem && data.author) authorElem.textContent = data.author;
    
    // Aktualisiere Closing Message
    const closingElem = document.getElementById('closing-message');
    if (closingElem && data.closingMessage) {
        closingElem.textContent = data.closingMessage;
    }
    
    console.log('HTML content updated');
}

/**
 * Extrahiert Content aus vorhandenem HTML (Fallback)
 * @returns {Object} - Extrahierte Content-Daten
 */
function extractContentFromHTML() {
    const title = document.getElementById('presentation-title')?.textContent || 'Masterarbeit';
    const subtitle = document.getElementById('presentation-subtitle')?.textContent || 'Präsentation';
    const author = document.getElementById('presentation-author')?.textContent || 'Autor';
    
    // Extrahiere Topics aus HTML (vereinfacht)
    const topics = [];
    for (let i = 1; i <= 6; i++) {
        topics.push({
            id: i,
            title: `Thema ${i}`,
            color: getDefaultColor(i),
            slides: [
                { title: `Thema ${i} - Übersicht`, content: `Inhalt für Thema ${i}` }
            ]
        });
    }
    
    return {
        title,
        subtitle,
        author,
        topics,
        closingMessage: document.getElementById('closing-message')?.textContent || 'Danke!'
    };
}

/**
 * Liefert Standard-Farbe für Topic-Index
 * @param {number} index - Topic-Index (1-basiert)
 * @returns {string} - Hex-Farbe
 */
function getDefaultColor(index) {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#009688'];
    return colors[(index - 1) % colors.length];
}

/**
 * Speichert Content-Daten in JSON-Datei
 * Verwendet File System Access API oder Download-Fallback
 */
export async function saveContent() {
    if (!contentData) {
        console.error('No content data to save');
        return;
    }
    
    const jsonString = JSON.stringify(contentData, null, 2);
    
    if (isFileSystemAccessSupported()) {
        // Verwende File System Access API
        await saveWithFileSystemAPI(jsonString);
    } else {
        // Fallback: Download als Datei
        downloadContentAsFile(jsonString);
    }
}

/**
 * Speichert Datei mit File System Access API
 * @param {string} content - JSON-String zum Speichern
 */
async function saveWithFileSystemAPI(content) {
    try {
        let fileHandle = currentFileHandle;
        
        // Wenn keine Handle vorhanden, frage nach Speicherort
        if (!fileHandle) {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: 'content.json',
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            currentFileHandle = fileHandle;
        }
        
        // Schreibe Datei
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        
        console.log('Content saved successfully with File System Access API');
        alert('Inhalt erfolgreich gespeichert!');
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error saving with File System API:', error);
            // Fallback zu Download
            downloadContentAsFile(content);
        }
    }
}

/**
 * Download Content als Datei (Fallback)
 * @param {string} content - JSON-String zum Download
 */
function downloadContentAsFile(content) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Content downloaded as file');
    alert('Inhalt als Datei heruntergeladen. Bitte ersetzen Sie data/content.json manuell.');
}

/**
 * Importiert Content aus Datei
 */
export async function importContent() {
    if (isFileSystemAccessSupported()) {
        await importWithFileSystemAPI();
    } else {
        // Fallback: File Input verwenden
        triggerFileInput();
    }
}

/**
 * Importiert Datei mit File System Access API
 */
async function importWithFileSystemAPI() {
    try {
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'JSON Files',
                accept: { 'application/json': ['.json'] }
            }],
            multiple: false
        });
        
        currentFileHandle = fileHandle;
        const file = await fileHandle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Aktualisiere Content-Daten
        contentData = data;
        setContentData(data);
        updateHTMLContent(data);
        initMenu(); // Re-initialisiere Menü
        
        console.log('Content imported successfully', data);
        alert('Inhalt erfolgreich importiert!');
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error importing content:', error);
            alert('Fehler beim Importieren: ' + error.message);
        }
    }
}

/**
 * Trigger File Input (Fallback für Import)
 */
function triggerFileInput() {
    const input = document.getElementById('import-file-input');
    if (input) {
        input.click();
    }
}

/**
 * Handhabt File Input Change (Fallback)
 * @param {Event} event - Change Event
 */
export function handleFileInputChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            contentData = data;
            setContentData(data);
            updateHTMLContent(data);
            initMenu();
            
            console.log('Content imported via file input', data);
            alert('Inhalt erfolgreich importiert!');
            
        } catch (error) {
            console.error('Error parsing imported file:', error);
            alert('Fehler beim Importieren: Ungültige JSON-Datei');
        }
    };
    reader.readAsText(file);
}

/**
 * Liefert aktuelle Content-Daten
 * @returns {Object} - Content-Daten
 */
export function getContentData() {
    return contentData;
}

/**
 * Aktualisiert Content-Daten (für Admin-Modus)
 * @param {Object} newData - Neue Content-Daten
 */
export function updateContentData(newData) {
    contentData = newData;
    setContentData(newData);
}

/**
 * ===================================
 * SLIDE EDITS PERSISTENCE
 * Speichert bearbeitete Slide-Inhalte
 * Persistiert via localStorage
 * ===================================
 */

const SLIDE_EDITS_STORAGE_KEY = 'slideEdits';

/**
 * Lädt gespeicherte Slide-Edits aus localStorage
 * @returns {Object} Objekt mit element identifier als Key und HTML-Content als Value
 */
export function getSlideEdits() {
    try {
        const stored = localStorage.getItem(SLIDE_EDITS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.warn('[Storage] Error reading slide edits:', error);
        return {};
    }
}

/**
 * Speichert Slide-Edits in localStorage
 * @param {Object} edits - Objekt mit element identifier und HTML-Content
 */
export function saveSlideEdits(edits) {
    try {
        localStorage.setItem(SLIDE_EDITS_STORAGE_KEY, JSON.stringify(edits));
        console.log('[Storage] Slide edits saved');
    } catch (error) {
        console.warn('[Storage] Error saving slide edits:', error);
    }
}

/**
 * Aktualisiert einen einzelnen Slide-Edit
 * @param {string} identifier - Element identifier
 * @param {string} content - HTML-Content
 */
export function updateSlideEdit(identifier, content) {
    const edits = getSlideEdits();
    edits[identifier] = content;
    saveSlideEdits(edits);
}

/**
 * Löscht einen Slide-Edit
 * @param {string} identifier - Element identifier
 */
export function removeSlideEdit(identifier) {
    const edits = getSlideEdits();
    delete edits[identifier];
    saveSlideEdits(edits);
}

/**
 * Löscht alle Slide-Edits
 */
export function clearAllSlideEdits() {
    localStorage.removeItem(SLIDE_EDITS_STORAGE_KEY);
    console.log('[Storage] All slide edits cleared');
}

/**
 * ===================================
 * BOOKMARK PERSISTENCE
 * Speichert Lesezeichen für Childnode-Tiles
 * Persistiert via localStorage
 * ===================================
 */

const BOOKMARKS_STORAGE_KEY = 'thesis-presentation-bookmarks';

/**
 * Lädt alle Bookmarks aus localStorage
 * @returns {Array<{parentId: number, childIndex: number}>} Array von Bookmarks
 */
export function getBookmarks() {
    try {
        const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn('[Storage] Error reading bookmarks:', error);
    }
    return [];
}

/**
 * Speichert Bookmarks in localStorage
 * @param {Array<{parentId: number, childIndex: number}>} bookmarks - Bookmark-Array
 */
function saveBookmarks(bookmarks) {
    try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (error) {
        console.warn('[Storage] Error saving bookmarks:', error);
    }
}

/**
 * Prüft ob ein Bookmark existiert
 * @param {number} parentId - Parent Topic ID
 * @param {number} childIndex - Child Index
 * @returns {boolean} true wenn Bookmark existiert
 */
export function hasBookmark(parentId, childIndex) {
    const bookmarks = getBookmarks();
    return bookmarks.some(b => b.parentId === parentId && b.childIndex === childIndex);
}

/**
 * Togglet ein Bookmark (hinzufügen/entfernen)
 * @param {number} parentId - Parent Topic ID
 * @param {number} childIndex - Child Index
 * @returns {boolean} true wenn Bookmark jetzt gesetzt ist, false wenn entfernt
 */
export function toggleBookmarkStorage(parentId, childIndex) {
    const bookmarks = getBookmarks();
    const existingIndex = bookmarks.findIndex(
        b => b.parentId === parentId && b.childIndex === childIndex
    );
    
    if (existingIndex >= 0) {
        // Entferne Bookmark
        bookmarks.splice(existingIndex, 1);
        saveBookmarks(bookmarks);
        console.log(`[Storage] Bookmark removed: ${parentId}-${childIndex}`);
        return false;
    } else {
        // Füge Bookmark hinzu
        bookmarks.push({ parentId, childIndex });
        saveBookmarks(bookmarks);
        console.log(`[Storage] Bookmark added: ${parentId}-${childIndex}`);
        return true;
    }
}

/**
 * Entfernt ein spezifisches Bookmark
 * @param {number} parentId - Parent Topic ID
 * @param {number} childIndex - Child Index
 */
export function removeBookmark(parentId, childIndex) {
    const bookmarks = getBookmarks();
    const filteredBookmarks = bookmarks.filter(
        b => !(b.parentId === parentId && b.childIndex === childIndex)
    );
    saveBookmarks(filteredBookmarks);
}

/**
 * Entfernt alle Bookmarks
 */
export function clearAllBookmarks() {
    saveBookmarks([]);
    console.log('[Storage] All bookmarks cleared');
}
