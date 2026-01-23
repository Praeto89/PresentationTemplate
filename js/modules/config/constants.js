/**
 * Configuration Constants
 * Zentrale Verwaltung aller Magic Numbers und Konstanten
 */

/**
 * Animation Durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  zoomIn: 800,
  zoomOut: 500,
  autosave: 400,
  slideTransition: 300,
  controlDelay: 1000,
  notificationDisplay: 3000,
};

/**
 * Layout Constants
 * Used for responsive menu and mindmap positioning
 */
export const LAYOUT_CONSTANTS = {
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

/**
 * Storage Keys
 * localStorage key names for persistence
 */
export const STORAGE_KEYS = {
  slideEdits: 'slideEdits',
  bookmarks: 'thesis-presentation-bookmarks',
  contentData: 'contentData',
  speakerLayout: 'reveal-speaker-layout',
};

/**
 * Reveal.js Configuration
 * Presentation-specific settings
 */
export const REVEAL_CONFIG = {
  // Display and navigation
  center: true,
  transition: 'fade',
  transitionSpeed: 'default',
  
  // Responsive
  width: 1920,
  height: 1080,
  margin: 0.1,
  
  // Plugins
  plugins: ['RevealNotes', 'RevealMarkdown', 'RevealHighlight', 'RevealMath'],
};

/**
 * Editor Configuration
 */
export const EDITOR_CONFIG = {
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

/**
 * Admin Configuration
 */
export const ADMIN_CONFIG = {
  maxSubtopics: 6,
  defaultSubtopicTitle: 'Neues Subtopic',
  enableDragReorder: true,
  enableSizeControls: true,
};

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  notificationTimeout: 3000,
  overlayTransitionDuration: 200,
  hintPosition: 'bottom-right',
};

/**
 * Debug Mode
 */
export const DEBUG = {
  enabled: false,
  logLayout: false,
  logViewportChanges: false,
  logEditorChanges: false,
  logStorageEvents: false,
};
