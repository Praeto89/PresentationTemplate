/**
 * Subtopic Detail Module
 * Handles showing and hiding subtopic detail panels
 */

/**
 * Show subtopic detail content
 * @param {number} topicId - The parent topic ID
 * @param {number} subtopicIndex - The index of the subtopic within the topic
 * @param {string} subtopicTitle - The title of the subtopic
 */
export function showSubtopicDetail(topicId, subtopicIndex, subtopicTitle) {
    const detailPanel = document.querySelector('.subtopic-detail-panel');
    if (!detailPanel) {
        console.warn('[SubtopicDetail] Panel not found in DOM');
        return;
    }
    
    // Fetch content from contentData (loaded globally via storage.js)
    const content = getSubtopicContent(topicId, subtopicIndex);
    
    // Render detail panel
    detailPanel.innerHTML = `
        <div class="subtopic-detail-container">
            <div class="subtopic-detail-header">
                <h2 class="subtopic-detail-title">${escapeHtml(subtopicTitle)}</h2>
                <button class="subtopic-detail-close" type="button" aria-label="Detail schließen">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="subtopic-detail-content">
                ${content ? escapeHtml(content) : '<p style="color: #999;">Inhalte werden noch erarbeitet...</p>'}
            </div>
        </div>
    `;
    
    // Show panel
    detailPanel.classList.add('active');
    
    // Setup close handler
    const closeButton = detailPanel.querySelector('.subtopic-detail-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            closeSubtopicDetail();
            document.removeEventListener('keydown', handleEscape);
        }, { once: true });
    }
    
    // Also close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeSubtopicDetail();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    console.log(`[SubtopicDetail] Showing: Topic ${topicId}, Subtopic ${subtopicIndex} - "${subtopicTitle}"`);
}

/**
 * Close subtopic detail panel
 */
export function closeSubtopicDetail() {
    const detailPanel = document.querySelector('.subtopic-detail-panel');
    if (detailPanel) {
        detailPanel.classList.remove('active');
        detailPanel.innerHTML = '';
    }
    console.log('[SubtopicDetail] Panel closed');
}

/**
 * Get subtopic content from global contentData
 * @param {number} topicId - The parent topic ID
 * @param {number} subtopicIndex - The index of the subtopic
 * @returns {string|null} The subtopic content or null if not found
 */
function getSubtopicContent(topicId, subtopicIndex) {
    try {
        // contentData is loaded by storage.js and available globally
        if (typeof window.contentData === 'undefined') {
            console.warn('[SubtopicDetail] contentData not available');
            return null;
        }
        
        const topics = window.contentData.topics || [];
        const topic = topics.find(t => t.id === topicId);
        
        if (!topic) {
            console.warn(`[SubtopicDetail] Topic ${topicId} not found`);
            return null;
        }
        
        const subtopics = topic.subtopics || [];
        
        // Handle both string array (legacy) and object array (new format)
        const subtopic = subtopics[subtopicIndex];
        if (!subtopic) {
            console.warn(`[SubtopicDetail] Subtopic ${subtopicIndex} not found in topic ${topicId}`);
            return null;
        }
        
        // If subtopic is an object with content property
        if (typeof subtopic === 'object' && subtopic.content) {
            return subtopic.content;
        }
        
        // If subtopic is just a string (legacy format)
        if (typeof subtopic === 'string') {
            return null; // No content available for legacy format
        }
        
        return null;
    } catch (error) {
        console.error('[SubtopicDetail] Error getting content:', error);
        return null;
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} The escaped text
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
