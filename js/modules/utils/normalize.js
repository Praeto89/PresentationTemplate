/**
 * Normalization Utilities
 * Provides consistent data structure conversion
 */

/**
 * Normalize subtopic entry to standard format
 * @param {string|Object} entry - Subtopic entry (can be string or object)
 * @returns {Object} Normalized subtopic object {title, position}
 */
export function normalizeSubtopic(entry) {
  if (typeof entry === 'string') {
    return { title: entry, position: null };
  }
  if (entry && typeof entry === 'object') {
    return {
      title: entry.title ?? '',
      position: entry.position ?? null,
    };
  }
  return { title: '', position: null };
}

/**
 * Normalize topic entry to standard format
 * @param {Object} topic - Topic object
 * @returns {Object} Normalized topic object
 */
export function normalizeTopic(topic) {
  if (!topic || typeof topic !== 'object') {
    return { id: null, title: '', color: '#000', subtopics: [] };
  }

  return {
    id: topic.id ?? null,
    title: topic.title ?? '',
    color: topic.color ?? '#000',
    subtopics: Array.isArray(topic.subtopics)
      ? topic.subtopics.map(normalizeSubtopic)
      : [],
  };
}
