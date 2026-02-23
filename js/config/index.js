/**
 * Unified Configuration Module
 * Zentrale Verwaltung aller Konfigurationen und Konstanten
 * 
 * Consolidates former src/config.js and js/modules/config/constants.js
 */

// ==========================
// 1. DEBUG MODE
// ==========================
export const DEBUG = true;

// ==========================
// 2. APP BOOTSTRAP
// ==========================
export const APP = {
  bootDelayMs: 500,
};

// ==========================
// 3. REVEAL.JS CONFIGURATION
// ==========================
export const REVEAL = {
  hash: true,
  width: 1920,
  height: 1080,
  margin: 0.04,
  minScale: 0.2,
  maxScale: 2.0,
  controls: true,
  progress: false,
  center: true,
  keyboard: false, // Disable Reveal keyboard handling completely
  transition: 'slide',
  transitionSpeed: 'default',
  // Plugins are resolved in the adapter to keep Reveal globals untouched
  plugins: ['markdown', 'highlight', 'notes']
};

// ==========================
// 4. ANIMATION DURATIONS (in milliseconds)
// ==========================
export const ANIMATIONS = {
  zoomIn: 800,
  zoomOut: 500,
  autosave: 400,
  slideTransition: 300,
  controlDelay: 1000,
  notificationDisplay: 3000,
};

// ==========================
// 5. LAYOUT CONSTANTS
// ==========================
export const LAYOUT = {
  // Menu tile positioning
  radiusFactor: 0.28,        // Proportion of viewport for circle radius
  tileSizeFactor: 0.14,      // Proportion of viewport for tile size
  minRadius: 200,            // Minimum circle radius in pixels
  maxTileSize: 220,          // Maximum tile size in pixels
  
  // Mindmap childnode positioning
  childnodeRadiusBase: 120,  // Base radius for childnode circle
  childnodeDistanceFactor: 1.5, // Distance multiplier from parent
  childnodeSizeIdle: 60,     // Idle state size
  childnodeSizeFocus: 96,    // Focus state size (1.6x of idle)
  
  // Zoom/Scale
  focusScaleBias: 0.65,      // Viewport coverage when focused
  minZoom: 1,
  maxZoom: 2.4,
};

// ==========================
// 6. STORAGE KEYS  (single source of truth for all localStorage key names)
// ==========================
export const STORAGE = {
  // Content & editing
  slideEdits: 'slideEdits',
  bookmarks: 'thesis-presentation-bookmarks',
  contentData: 'contentData',
  speakerLayout: 'reveal-speaker-layout',

  // Slide generation
  generationMetadata: 'slide-generation-metadata',
  circleCount: 'overview-circle-count',

  // Student / layer system
  layerModeEnabled: 'layerModeEnabled',
  layerCount: 'layerCount',
  studentConfigs: 'studentConfigs',
  currentStudent: 'currentStudent',
  sharedCircleTitles: 'sharedCircleTitlesEnabled',
};

// ==========================
// 7. EDITOR CONFIGURATION
// ==========================
export const EDITOR = {
  editableElements: [
    'overview-title',
    'group-subtitle',
    'detail-slide h1, h2, h3, h4, h5, h6',
    'detail-slide p',
    'nav-box h4',
    'nav-box p',
  ],
  autoSaveDelay: 500, // Delay before saving edits (ms)
  enableKeyboardShortcuts: true,
};

// ==========================
// 8. ADMIN CONFIGURATION
// ==========================
export const ADMIN = {
  maxSubtopics: 6,
  defaultSubtopicTitle: 'Neues Subtopic',
  enableDragReorder: true,
  enableSizeControls: true,
};

// ==========================
// 9. UI CONFIGURATION
// ==========================
export const UI = {
  notificationTimeout: 3000,
  overlayTransitionDuration: 200,
  hintPosition: 'bottom-right',
};

// ==========================
// 10. DEBUG CONFIGURATION
// ==========================
export const DEBUG_CONFIG = {
  enabled: false,
  logLayout: false,
  logViewportChanges: false,
  logEditorChanges: false,
  logStorageEvents: false,
};

// ==========================
// DEFAULT EXPORT
// ==========================
export default {
  DEBUG,
  APP,
  REVEAL,
  ANIMATIONS,
  LAYOUT,
  STORAGE,
  EDITOR,
  ADMIN,
  UI,
  DEBUG_CONFIG,
};
