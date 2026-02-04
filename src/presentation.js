// ════════════════════════════════════════════════════════════════════════════
// PRESENTATION - Minimal Navigation Setup
// Reveal.js als Slide-Engine, kein Zoom, keine Plugins
// ════════════════════════════════════════════════════════════════════════════

import { initEditor } from './editor.js';
import { initEditMode } from '../js/modules/edit-mode.js';

async function init() {
  // If in edit mode, remove hash and disable hash tracking
  const urlParams = new URLSearchParams(window.location.search);
  const isEditMode = urlParams.get('mode') === 'edit';
  
  if (isEditMode) {
    // Remove hash from URL to start fresh
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }
  
  // Initialize Reveal.js
  await Reveal.initialize({
    hash: false, // Disable hash to prevent auto-navigation
    controls: true,
    progress: true,
    center: true,
    keyboard: true,
    transition: 'zoom',
    transitionSpeed: 'default',
    width: 1920,
    height: 1080,
    margin: 0.04,
    minScale: 0.2,
    maxScale: 2.0,
    viewDistance: 3,
    mobileViewDistance: 2
  });
  
  // Wait for Reveal ready, then navigate to slide 0
  Reveal.on('ready', () => {
    setTimeout(() => {
      Reveal.slide(0, 0, 0);
    }, 100);
  });
  
  // Also navigate immediately
  Reveal.slide(0, 0, 0);
  
  // Setup clickable navigation boxes
  setupNavigationBoxes();
  
  // Setup circle navigation on overview
  setupCircleNavigation();

  // Setup custom overview → group navigation sequence
  // DISABLED - now handled by custom controls module
  // setupOverviewNavigationLoop();

  // Flash fragments: keep flash visible while current; circle fragments hide the flash
  Reveal.on('fragmentshown', (event) => {
    const el = event.fragment;
    if (!el) return;

    if (el.classList.contains('circle-flash')) {
      el.classList.remove('done');
      const circle = el.nextElementSibling;
      if (circle && circle.classList.contains('circle-item')) {
        circle.classList.remove('shown');
      }
      return;
    }

    if (el.classList.contains('circle-item')) {
      const prevFlash = el.previousElementSibling;
      if (prevFlash && prevFlash.classList.contains('circle-flash')) {
        prevFlash.classList.add('done');
      }
      el.classList.add('shown');
    }
  });

  Reveal.on('fragmenthidden', (event) => {
    const el = event.fragment;
    if (!el) return;

    if (el.classList.contains('circle-flash')) {
      el.classList.add('done');
      const circle = el.nextElementSibling;
      if (circle && circle.classList.contains('circle-item')) {
        circle.classList.add('shown');
      }
      return;
    }

    if (el.classList.contains('circle-item')) {
      const prevFlash = el.previousElementSibling;
      if (prevFlash && prevFlash.classList.contains('circle-flash')) {
        prevFlash.classList.remove('done');
      }
      el.classList.remove('shown');
    }
  });
  
  // ESC returns to overview
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      Reveal.slide(0);
    }
  });
  
  // Custom arrow key navigation
  registerCustomNavigationControls();
  
  // Initialize editor if in edit mode
  initEditor();
  initEditMode();
  
  // Apply global background image if provided via URL or data attribute
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const bgParam = urlParams.get('bg');
    const revealEl = document.querySelector('.reveal');
    const bgAttrReveal = revealEl && revealEl.dataset ? revealEl.dataset.bg : null;
    const bgAttrBody = document.body && document.body.dataset ? document.body.dataset.bg : null;
    const bg = bgParam || bgAttrBody || bgAttrReveal;

    if (bg && revealEl) {
      applyBackgroundImage(revealEl, bg, '[Presentation] Applied background image (explicit)');
    } else {
      // No explicit background provided; try auto-detect from assets/background/
      await tryAutoBackgroundFromFolder(revealEl);
    }
  } catch (e) {
    console.warn('[Presentation] Failed to apply background image', e);
  }

  console.log('Presentation initialized');
}

async function tryAutoBackgroundFromFolder(revealEl) {
  if (!revealEl) return;

  const candidates = [
    'assets/background/background.png',
    'assets/background/background.jpg',
    'assets/background/background.jpeg',
    'assets/background/background.webp',
    'assets/background/Hintergrund.jpg',
    'assets/background/Hintergrund.jpeg',
    'assets/background/Hintergrund.png',
    'assets/background/Hintergrund.webp',
    'assets/background/bg.jpg',
    'assets/background/bg.jpeg',
    'assets/background/bg.png',
    'assets/background/bg.webp',
    'assets/background/paper.jpg',
    'assets/background/paper.png',
    'assets/background/texture.jpg',
    'assets/background/texture.png'
  ];

  // Pick the first candidate path; don't block on preload
  const firstCandidate = candidates.find((c) => c);

  // If directory listing is available, prefer its first image
  const listed = await findFirstImageInDirectory();
  if (listed) {
    applyBackgroundImage(revealEl, listed, '[Presentation] Auto background applied (folder first image)');
    return;
  }

  if (firstCandidate) {
    applyBackgroundImage(revealEl, firstCandidate, '[Presentation] Auto background applied (default candidate)');
    return;
  }

  // Fallback: attempt to parse directory listing (Python http.server shows index)
  try {
    const res = await fetch('assets/background/');
    if (!res.ok) return;
    const html = await res.text();
    const matches = Array.from(html.matchAll(/href=\"([^\"]+)\"/g))
      .map(m => m[1])
      .filter(href => /\.(jpg|jpeg|png|webp)$/i.test(href));

    if (matches.length > 0) {
      const first = matches[0].startsWith('http')
        ? matches[0]
        : `assets/background/${matches[0].replace(/^\/?/, '')}`;
      applyBackgroundImage(revealEl, first, '[Presentation] Auto background applied (folder listing)');
    }
  } catch (err) {
    console.warn('[Presentation] Could not read assets/background/ listing', err);
  }
}

async function findFirstImageInDirectory() {
  try {
    const res = await fetch('assets/background/');
    if (!res.ok) return null;
    const html = await res.text();
    const matches = Array.from(html.matchAll(/href=\"([^\"]+)\"/g))
      .map(m => m[1])
      .filter(href => /\.(jpg|jpeg|png|webp)$/i.test(href));
    if (matches.length === 0) return null;
    const first = matches[0].startsWith('http')
      ? matches[0]
      : `assets/background/${matches[0].replace(/^\/?/, '')}`;
    return first;
  } catch (err) {
    return null;
  }
}

function applyBackgroundImage(revealEl, path, logPrefix) {
  const urlVal = `url(${path})`;
  revealEl.style.setProperty('--bg-image', urlVal);
  // Also apply to html/body as a safety net
  document.documentElement.style.backgroundImage = urlVal;
  document.body.style.backgroundImage = urlVal;
  document.documentElement.style.backgroundSize = 'cover';
  document.body.style.backgroundSize = 'cover';
  document.documentElement.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.documentElement.style.backgroundPosition = 'center';
  document.body.style.backgroundPosition = 'center';
  revealEl.classList.add('has-bg-image');
  revealEl.classList.add('bg-image-active');

  // Hide Reveal's built-in background layers so ours shows through
  const backgrounds = document.querySelector('.reveal .backgrounds');
  if (backgrounds) {
    backgrounds.style.opacity = '0';
    backgrounds.style.background = 'transparent';
    backgrounds.style.display = 'none';
  }

  if (logPrefix) {
    console.log(logPrefix, path);
  }
}

function setupOverviewNavigationLoop() {
  let sequence = [];
  let seqIndex = 0;

  const buildSequence = () => {
    const overview = document.querySelector('#overview');
    if (!overview) return;

    const overviewIdx = Reveal.getIndices(overview);
    const groups = Array.from(document.querySelectorAll('.group-intro'))
      .map((el) => ({ el, idx: Reveal.getIndices(el) }))
      .sort((a, b) => a.idx.h - b.idx.h);

    const newSeq = [];
    newSeq.push(overviewIdx);
    groups.forEach((g) => {
      newSeq.push(g.idx);   // group intro
      newSeq.push(overviewIdx); // back to overview
    });

    sequence = newSeq;
    // Align seqIndex to current slide if possible
    const current = Reveal.getIndices();
    const found = sequence.findIndex((s) => s.h === current.h && s.v === current.v);
    seqIndex = found >= 0 ? found : 0;
  };

  const goNextInSequence = () => {
    // If fragments are still available, advance them first
    const fragments = Reveal.availableFragments();
    if (fragments && fragments.next) {
      Reveal.nextFragment();
      return;
    }

    seqIndex = (seqIndex + 1) % sequence.length;
    const target = sequence[seqIndex];
    Reveal.slide(target.h, target.v);
  };

  const syncSeqIndex = () => {
    const current = Reveal.getIndices();
    const match = sequence.findIndex((s, i) => s.h === current.h && s.v === current.v && i >= seqIndex);
    if (match >= 0) {
      seqIndex = match;
      return;
    }
    const fallback = sequence.findIndex((s) => s.h === current.h && s.v === current.v);
    if (fallback >= 0) {
      seqIndex = fallback;
    }
  };

  Reveal.on('ready', buildSequence);
  Reveal.on('slidechanged', syncSeqIndex);

  // Keyboard right
  // REMOVED - handled by custom controls module instead
  // document.addEventListener('keydown', (e) => {
  //   if (e.key === 'ArrowRight') {
  //     e.preventDefault();
  //     goNextInSequence();
  //   }
  // });

  // Click on right control
  Reveal.on('ready', () => {
    const rightControl = document.querySelector('.navigate-right');
    if (rightControl) {
      rightControl.addEventListener('click', (e) => {
        e.preventDefault();
        goNextInSequence();
      });
    }
  });
}

// Track currently hovered slide
let currentHoveredSlide = null;
let currentHoveredClass = null;
let currentHoveredVIndex = null;

function registerCustomNavigationControls() {
  const handler = (e) => {
    const arrowKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    
    if (!arrowKeys.includes(e.key)) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    
    console.log('[Navigation] Arrow key pressed:', e.key);
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    const currentIndices = Reveal.getIndices();
    
    switch(e.key) {
      case 'ArrowRight':
        console.log('[Navigation] Right - navigating to next topic');
        // Remove any active hover
        if (currentHoveredSlide && currentHoveredClass) {
          currentHoveredSlide.classList.remove('simulated-hover', currentHoveredClass);
          currentHoveredSlide = null;
          currentHoveredClass = null;
          currentHoveredVIndex = null;
        }
        navigateToNextTopic(currentIndices);
        break;
        
      case 'ArrowLeft':
        toggleHover(currentIndices, 0);
        break;
        
      case 'ArrowUp':
        toggleHover(currentIndices, 2);
        break;
        
      case 'ArrowDown':
        toggleHover(currentIndices, 3);
        break;
    }
  };
  
  window.addEventListener('keydown', handler, { capture: true, passive: false });
  document.addEventListener('keydown', handler, { capture: true, passive: false });
  console.log('[Navigation] Custom controls registered');
}

function toggleHover(currentIndices, vIndex) {
  // Check if same key pressed again
  if (currentHoveredVIndex === vIndex && currentHoveredSlide) {
    console.log(`[Navigation] Same key pressed - returning to main slide`);
    // Remove hover
    currentHoveredSlide.classList.remove('simulated-hover', currentHoveredClass);
    currentHoveredSlide = null;
    currentHoveredClass = null;
    currentHoveredVIndex = null;
  } else {
    // Different key or no hover active - show new hover
    console.log(`[Navigation] Showing hover for v=${vIndex}`);
    // Remove previous hover if any
    if (currentHoveredSlide && currentHoveredClass) {
      currentHoveredSlide.classList.remove('simulated-hover', currentHoveredClass);
    }
    // Show new hover
    hoverPlaceholder(currentIndices, vIndex);
    currentHoveredVIndex = vIndex;
  }
}

function navigateToNextTopic(currentIndices) {
  // From overview (h=0) jump directly to first topic
  if (currentIndices.h === 0) {
    console.log('[Navigation] Moving from overview to first topic');
    Reveal.slide(1, 1);
    return;
  }

  // From a topic (h>=1), go to next topic in sequence
  const topics = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  let nextTopic = topics.find((t) => t > currentIndices.h);

  if (!nextTopic) {
    nextTopic = topics[0];
  }

  console.log(`[Navigation] Moving from h=${currentIndices.h} to h=${nextTopic}`);
  Reveal.slide(nextTopic, 1);
}

function hoverPlaceholder(currentIndices, vIndex) {
  console.log(`[Navigation] Hovering h=${currentIndices.h}, v=${vIndex}`);
  
  try {
    // Get the horizontal slide (section at h index)
    const hSlides = Reveal.getHorizontalSlides();
    if (!hSlides || !hSlides[currentIndices.h]) {
      console.error('[Navigation] Could not find horizontal slide');
      return;
    }
    
    const hSection = hSlides[currentIndices.h];
    // Get all vertical sections within this horizontal section
    const vSections = Array.from(hSection.querySelectorAll(':scope > section'));
    
    if (!vSections[vIndex]) {
      console.error(`[Navigation] Could not find vertical slide at v=${vIndex}, available: ${vSections.length}`);
      return;
    }
    
    const targetSlide = vSections[vIndex];
    console.log('[Navigation] Found target slide, adding hover:', targetSlide);
    
    // Add direction-specific class for different colors
    const directionClass = vIndex === 0 ? 'hover-left' : vIndex === 2 ? 'hover-top' : 'hover-bottom';
    targetSlide.classList.add('simulated-hover', directionClass);
    
    // Store reference to remove later
    currentHoveredSlide = targetSlide;
    currentHoveredClass = directionClass;
  } catch (err) {
    console.error('[Navigation] Error hovering placeholder:', err);
  }
}

function setupNavigationBoxes() {
  let expandedBox = null;
  let overlay = null;
  
  // Create overlay for expanded boxes
  overlay = document.createElement('div');
  overlay.className = 'nav-box-overlay';
  overlay.style.display = 'none';
  document.body.appendChild(overlay);
  
  // Setup click handlers for navigation boxes
  document.addEventListener('click', (e) => {
    const box = e.target.closest('.nav-box');
    if (!box) return;
    
    e.stopPropagation();

    // If this box is already expanded, collapse it
    if (box.classList.contains('expanded')) {
      collapseBox(box, overlay);
      expandedBox = null;
      return;
    }
    
    // If another box is expanded, collapse it first
    if (expandedBox) {
      collapseBox(expandedBox, overlay);
    }
    
    // Expand this box
    expandBox(box, overlay);
    expandedBox = box;
  });
  
  // Click on overlay to close
  overlay.addEventListener('click', () => {
    if (expandedBox) {
      collapseBox(expandedBox, overlay);
      expandedBox = null;
    }
  });
  
  // Setup return buttons
  document.addEventListener('click', (e) => {
    const returnBtn = e.target.closest('.return-to-main');
    if (!returnBtn) return;
    
    const indices = Reveal.getIndices();
    // Return to v=1 (group-intro) of current horizontal slide
    Reveal.slide(indices.h, 1);
  });
}

function expandBox(box, overlay) {
  const targetH = parseInt(box.dataset.targetH, 10);
  const targetV = parseInt(box.dataset.targetV, 10);
  
  console.log('[expandBox] Expanding box for h=', targetH, 'v=', targetV);
  
  // Get the target slide content
  const targetSlide = Reveal.getSlide(targetH, targetV);
  console.log('[expandBox] Target slide found:', !!targetSlide);
  
  if (!targetSlide) {
    console.warn('[expandBox] Target slide not found for h=', targetH, 'v=', targetV);
    return;
  }
  
  // Clone the slide content
  const content = targetSlide.cloneNode(true);
  content.classList.add('expanded-content');
  
  // Store original content
  box.dataset.originalContent = box.innerHTML;
  
  // Replace box content with slide content
  box.innerHTML = '';
  box.appendChild(content);
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-expanded-box';
  closeBtn.innerHTML = '✕';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    collapseBox(box, overlay);
  });
  box.appendChild(closeBtn);
  
  // Show overlay and expand box
  overlay.style.display = 'block';
  setTimeout(() => {
    overlay.classList.add('active');
    box.classList.add('expanded');
    console.log('[expandBox] Box expanded');
  }, 10);
}

function collapseBox(box, overlay) {
  box.classList.remove('expanded');
  overlay.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    // Restore original content
    if (box.dataset.originalContent) {
      box.innerHTML = box.dataset.originalContent;
      delete box.dataset.originalContent;
    }
  }, 300);
}

function showCircleHoverImages(circle) {
  // Only show if on overview slide (h=0) and NOT in Reveal's built-in overview mode
  const overviewSection = document.querySelector('#overview');
  if (!overviewSection || !overviewSection.classList.contains('present')) {
    return; // Only if overview is currently visible
  }

  const slideNum = parseInt(circle.dataset.slide, 10);
  const isEven = slideNum % 2 === 0;
  
  // Construct folder path based on slide number
  const folderPath = `assets/images/slide-${slideNum}`;

  // Remove any existing overlay
  hideCircleHoverImages();

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'hover-image-overlay';

  // Try both possible file names and formats
  const possibleNames = [
    `${folderPath}/image-${isEven ? 'left' : 'right'}.jpg`,
    `${folderPath}/image-${isEven ? 'left' : 'right'}.png`,
  ];

  const img = document.createElement('img');
  img.className = isEven ? 'hover-image-left' : 'hover-image-right';
  
  // Try loading the image - if it fails, try next name
  let currentIndex = 0;
  
  const tryLoadImage = () => {
    if (currentIndex < possibleNames.length) {
      img.src = possibleNames[currentIndex];
      currentIndex++;
    } else {
      img.style.display = 'none';
    }
  };
  
  img.onerror = tryLoadImage;
  tryLoadImage();
  
  overlay.appendChild(img);

  // Append to reveal container
  const revealContainer = document.querySelector('.reveal');
  if (revealContainer) {
    revealContainer.appendChild(overlay);
    circle.dataset.hoverOverlayActive = 'true';
  }
}

function hideCircleHoverImages() {
  const overlay = document.querySelector('.hover-image-overlay');
  if (overlay) {
    overlay.remove();
    // Clear active state from all circles
    document.querySelectorAll('.circle-item').forEach(c => {
      delete c.dataset.hoverOverlayActive;
    });
  }
}

function setupCircleNavigation() {
  const circles = document.querySelectorAll('.circle-item');
  
  // Evenly distribute all circles on a single outer ring
  const total = circles.length; // dynamic count (now 10)
  const outerRadius = 430; // outer border radius
  const step = 360 / total;
  const offset = -90; // start at 12 o'clock
  
  circles.forEach((circle, idx) => {
    const angle = idx * step + offset;
    circle.style.setProperty('--angle', angle + 'deg');
    circle.style.setProperty('--radius', outerRadius + 'px');

    circle.addEventListener('click', () => {
      const slideIndex = parseInt(circle.dataset.slide, 10);
      if (!isNaN(slideIndex)) {
        Reveal.slide(slideIndex, 0); // Navigate to group-intro (v=0) - die Hauptslide
      }
    });

    // Add hover handlers for image overlay
    circle.addEventListener('mouseenter', () => {
      showCircleHoverImages(circle);
    });

    circle.addEventListener('mouseleave', () => {
      // Only hide if this circle is still the active one
      if (circle.dataset.hoverOverlayActive === 'true') {
        hideCircleHoverImages();
      }
    });
  });
}

// Make setupNavigationBoxes globally accessible for edit-mode.js
window.setupNavigationBoxes = setupNavigationBoxes;

// Start
init();
