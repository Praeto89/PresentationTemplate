// App configuration (temporary bridge while refactoring)

export const DEBUG = true;

export const revealConfig = {
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

export const bootDelayMs = 500;