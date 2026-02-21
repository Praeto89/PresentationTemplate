/**
 * ════════════════════════════════════════════════════════════════════════════
 * SLIDE GENERATOR - Dynamisch Slides, Topics, Kreise generieren
 * Erstellt komplette Reveal.js Struktur basierend auf Kreis-Anzahl
 * ════════════════════════════════════════════════════════════════════════════
 */

import { getCurrentStudent } from './student-manager.js';
import { getContentData } from './storage.js';

/**
 * Generiert alle Overview-Kreise basierend auf Topics aus content.json
 * @param {number} circleCount - Anzahl Kreise (3-12)
 * @returns {string} HTML für Kreise
 */
export function generateOverviewCircles(circleCount) {
  console.log('[SlideGenerator] Generating', circleCount, 'overview circles');
  
  const contentData = getContentData();
  const topics = contentData?.topics || [];
  
  let circlesHTML = '';
  const outerRadius = 430;
  const step = 360 / circleCount;
  const offset = -90; // Start at 12 o'clock
  
  for (let i = 0; i < circleCount; i++) {
    const angle = i * step + offset;
    const themeNumber = i + 1;
    // Use title from content.json if available, otherwise fallback
    const topicTitle = topics[i]?.title || `Thema ${themeNumber}`;
    
    circlesHTML += `
    <!-- Kreis ${themeNumber} -->
    <div class="circle-item" data-slide="${themeNumber}" style="--angle: ${angle}deg; --radius: ${outerRadius}px">
      <div class="circle-number">${themeNumber}</div>
      <div class="circle-text">${topicTitle}</div>
    </div>
    `;
  }
  
  return circlesHTML;
}

/**
 * Generiert eine komplette Topic-Slide mit allen Detail-Slides
 * @param {number} topicNumber - Topic-Nummer (1-basiert)
 * @param {string} topicTitle - Titel des Topics
 * @param {string} topicId - Eindeutige ID des Topics
 * @param {number} detailSlidesCount - Anzahl Detail-Slides für dieses Topic
 * @returns {string} HTML für Topic-Slide Stack
 */
export function generateTopicSlide(topicNumber, topicTitle, topicId, detailSlidesCount = 3) {
  console.log(`[SlideGenerator] Generating topic ${topicNumber}: ${topicTitle}`);
  
  let slideHTML = `
  <!-- Folie ${topicNumber} | h=${topicNumber} | ${topicTitle} -->
  <section class="stack" data-topic-id="${topicId}">
    <!-- Group Intro Slide (v=0) - MUSS erste Slide sein! -->
    <section class="group-intro">
      <p class="group-subtitle">${topicTitle} Überblick</p>
      <div class="nav-boxes">
`;
  
  // Generiere Nav-Boxes für dieses Topic
  for (let i = 1; i < detailSlidesCount + 1; i++) {
    slideHTML += `
        <button class="nav-box" data-target-h="${topicNumber}" data-target-v="${i}" style="--box-index: ${i - 1}">
          <span class="box-title">Detail ${i}</span>
        </button>
`;
  }
  
  slideHTML += `
      </div>
      <button class="return-btn" onclick="Reveal.slide(0)">← Zur Übersicht</button>
    </section>
`;
  
  // Generiere Detail-Slides (v=1, v=2, v=3, ...)
  for (let i = 1; i <= detailSlidesCount; i++) {
    slideHTML += `
    <!-- Detail Slide ${i} -->
    <section class="detail-slide" data-parent-topic="${topicId}">
      <h5>${topicTitle} - Detail ${i}</h5>
      <p>Platzhalter für Inhalte</p>
      <p>Bearbeiten Sie diesen Text im Edit-Mode (Strg+E)</p>
      <button class="return-to-main">← Zurück zu ${topicTitle}</button>
    </section>
`;
  }
  
  slideHTML += `
  </section>
`;
  
  return slideHTML;
}

/**
 * Generiert alle Topic-Slides basierend auf Anzahl
 * Nutzt Student-Config aus Layer-Modus, wenn verfügbar
 * @param {number} topicCount - Anzahl Topics/Kreise (3-12), wird überschrieben wenn Student-Config existiert
 * @returns {string} HTML für alle Topic-Slides
 */
export function generateAllTopicSlides(topicCount) {
  // Prüfe ob Student-Config existiert
  const student = getCurrentStudent();
  if (student) {
    topicCount = student.topicCount;
  }
  
  console.log('[SlideGenerator] Generating', topicCount, 'topic slides');
  
  let allSlidesHTML = '';
  
  // Nutze Student-Config oder Standard
  const detailSlidesPerTopic = student ? student.detailSlidesPerTopic : 3;
  
  const contentData = getContentData();
  const topics = contentData?.topics || [];
  
  for (let i = 1; i <= topicCount; i++) {
    const topicTitle = topics[i - 1]?.title || `Thema ${i}`;
    const topicId = `topic-${i}`;
    allSlidesHTML += generateTopicSlide(i, topicTitle, topicId, detailSlidesPerTopic);
  }
  
  
  return allSlidesHTML;
}

/**
 * Generiert die komplette Closing Slide
 * @returns {string} HTML für Closing Slide
 */
export function generateClosingSlide() {
  return `
  <!-- Closing Slide -->
  <section class="closing-slide">
    <h2>Vielen Dank!</h2>
    <p>Fragen?</p>
  </section>
`;
}

/**
 * Generiert komplettes Reveal.js Slide-HTML
 * Nutzt Student-Config aus Layer-Modus, wenn verfügbar
 * @param {number} circleCount - Anzahl Kreise/Topics (3-12), wird ignoriert wenn Student-Config existiert
 * @param {string} title - Präsentationstitel
 * @param {string} subtitle - Untertitel
 * @param {string} author - Autor
 * @returns {string} Komplettes HTML für alle Slides
 */
export function generateCompleteSlidesHTML(circleCount, title, subtitle, author) {
  // Prüfe ob Student-Config existiert
  const student = getCurrentStudent();
  if (student) {
    circleCount = student.topicCount;
    console.log('[SlideGenerator] Using student config:', student.name, 'with', circleCount, 'circles');
  }
  
  console.log('[SlideGenerator] Generating complete HTML for', circleCount, 'circles');
  
  if (circleCount < 3 || circleCount > 25) {
    console.error('[SlideGenerator] Invalid circle count:', circleCount);
    return '';
  }
  
  let html = `
      <!-- Slide 0 | Übersicht -->
      <section id="overview" class="overview-slide">
        <div class="spiral-container">
          <div class="overview-title">${title}<br>Untertitel Platzhalter</div>
          <div class="overview-subtitle">${author} – TT.MM.JJJJ<br>Betreuung: Betreuende Person</div>
          <div class="overview-subtitle">Institution / Organisation</div>

          <!-- Overview Kreise -->
          ${generateOverviewCircles(circleCount)}
        </div>
      </section>

      <!-- Topic Slides -->
      ${generateAllTopicSlides(circleCount)}

      <!-- Closing Slide -->
      ${generateClosingSlide()}
  `;
  
  return html;
}

/**
 * Speichert generierte Struktur in localStorage
 * @param {number} circleCount - Anzahl generierte Kreise
 * @param {Object} metadata - Metadaten (title, author, etc.)
 */
export function saveGenerationMetadata(circleCount, metadata) {
  const data = {
    generatedAt: new Date().toISOString(),
    circleCount,
    detailSlidesPerTopic: 3,
    metadata
  };
  
  localStorage.setItem('slide-generation-metadata', JSON.stringify(data));
  localStorage.setItem('overview-circle-count', circleCount.toString());
  console.log('[SlideGenerator] Saved generation metadata:', data);
}

/**
 * Lädt Generations-Metadaten aus localStorage
 * @returns {Object|null} Metadaten oder null
 */
export function loadGenerationMetadata() {
  const data = localStorage.getItem('slide-generation-metadata');
  if (data) {
    console.log('[SlideGenerator] Loaded generation metadata');
    return JSON.parse(data);
  }
  return null;
}
