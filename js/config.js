/**
 * Unified Configuration Module
 * Zentrale Verwaltung aller App-Konfigurationen
 * 
 * Struktur:
 * - CONFIG.reveal      → Reveal.js Konfiguration
 * - CONFIG.animation   → Animation Durations
 * - CONFIG.layout      → Layout Constants
 * - CONFIG.editor      → Editor Konfiguration
 * - CONFIG.admin       → Admin Konfiguration
 * - CONFIG.ui          → UI Konfiguration
 * - CONFIG.storage     → Storage Keys
 * - CONFIG.debug       → Debug Settings
 */

// =====================
// REVEAL.JS CONFIGURATION
// =====================
const REVEAL_CONFIG = {
  // Display and navigation
  center: true,
  transition: 'fade',
  transitionSpeed: 'default',
  
  // Responsive
  width: 1920,
  height: 1080,
  margin: 0.1,
  
  // Controls
  controls: true,
  progress: false,
  keyboard: false, // Disable Reveal keyboard handling
  hash: true,
  
  // Scaling
  minScale: 0.2,
  maxScale: 2.0,
  
  // Plugins
  plugins: ['RevealNotes', 'RevealMarkdown', 'RevealHighlight', 'RevealMath'],
};

// =====================
// ANIMATION DURATIONS (in milliseconds)
// =====================
const ANIMATION_DURATIONS = {
  zoomIn: 800,
  zoomOut: 500,
  autosave: 400,
  slideTransition: 300,
  controlDelay: 1000,
  notificationDisplay: 3000,
};

// =====================
// LAYOUT CONSTANTS
// =====================
const LAYOUT_CONSTANTS = {
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

// =====================
// STORAGE KEYS
// =====================
const STORAGE_KEYS = {
  slideEdits: 'slideEdits',
  bookmarks: 'thesis-presentation-bookmarks',
  contentData: 'contentData',
  speakerLayout: 'reveal-speaker-layout',
};

// =====================
// EDITOR CONFIGURATION
// =====================
const EDITOR_CONFIG = {
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

// =====================
// ADMIN CONFIGURATION
// =====================
const ADMIN_CONFIG = {
  maxSubtopics: 6,
  defaultSubtopicTitle: 'Neues Subtopic',
  enableDragReorder: true,
  enableSizeControls: true,
};

// =====================
// UI CONFIGURATION
// =====================
const UI_CONFIG = {
  notificationTimeout: 3000,
  overlayTransitionDuration: 200,
  hintPosition: 'bottom-right',
};

// =====================
// DEBUG SETTINGS
// =====================
const DEBUG = {
  enabled: false,
  logLayout: false,
  logEvents: false,
  logStorage: false,
};

// =====================
// EXPORT UNIFIED CONFIG
// =====================
export const CONFIG = {
  reveal: REVEAL_CONFIG,
  animation: ANIMATION_DURATIONS,
  layout: LAYOUT_CONSTANTS,
  storage: STORAGE_KEYS,
  editor: EDITOR_CONFIG,
  admin: ADMIN_CONFIG,
  ui: UI_CONFIG,
  debug: DEBUG,
};

// For backwards compatibility, also export individually
export const {
  reveal: revealConfig,
  animation: animationDurations,
  layout: layoutConstants,
  storage: storageKeys,
  editor: editorConfig,
  admin: adminConfig,
  ui: uiConfig,
  debug,
} = CONFIG;

export default CONFIG;
