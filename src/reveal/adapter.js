// Reveal adapter isolates direct Reveal.js usage.

function ensureReveal() {
  if (typeof Reveal === 'undefined') {
    throw new Error('Reveal.js not loaded');
  }
  return Reveal;
}

function resolvePlugin(nameOrObject) {
  if (typeof nameOrObject === 'string') {
    switch (nameOrObject) {
      case 'markdown':
        return typeof window !== 'undefined' ? window.RevealMarkdown : undefined;
      case 'highlight':
        return typeof window !== 'undefined' ? window.RevealHighlight : undefined;
      case 'notes':
        return typeof window !== 'undefined' ? window.RevealNotes : undefined;
      default:
        return undefined;
    }
  }
  return nameOrObject;
}

export async function initializeReveal(config) {
  const Reveal = ensureReveal();
  const pluginList = Array.isArray(config.plugins)
    ? config.plugins.map(resolvePlugin).filter(Boolean)
    : undefined;

  const finalConfig = { ...config, plugins: pluginList };
  return Reveal.initialize(finalConfig);
}

export function goToSlide(horizontalIndex, verticalIndex = 0) {
  const Reveal = ensureReveal();
  Reveal.slide(horizontalIndex, verticalIndex);
}

export function getIndices() {
  const Reveal = ensureReveal();
  return Reveal.getIndices();
}

export function onRevealReady(callback) {
  const Reveal = ensureReveal();
  if (typeof Reveal.on === 'function') {
    Reveal.on('ready', callback);
  } else if (typeof Reveal.addEventListener === 'function') {
    Reveal.addEventListener('ready', callback);
  }
}

export function onSlideChanged(callback) {
  const Reveal = ensureReveal();
  if (typeof Reveal.on === 'function') {
    Reveal.on('slidechanged', callback);
    return () => Reveal.off && Reveal.off('slidechanged', callback);
  }
  if (typeof Reveal.addEventListener === 'function') {
    const handler = (event) => callback(event);
    Reveal.addEventListener('slidechanged', handler);
    return () => Reveal.removeEventListener && Reveal.removeEventListener('slidechanged', handler);
  }
  return () => {};
}