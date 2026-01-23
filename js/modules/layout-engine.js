/**
 * Layout Engine Module
 * Positioniert Childnode-Tiles um Parent-Tile
 * 
 * LAYOUT HEURISTIKEN:
 * 1. Ring-Modus (default): Kinder gleichmäßig auf Kreis verteilt
 *    - Verwendet wenn genug Platz in alle Richtungen
 *    - Startwinkel bei -90° (oben) für visuelle Balance
 * 
 * 2. Halbkreis-Modus: Kinder nur auf einer Seite
 *    - Aktiviert wenn Parent nahe am Viewport-Rand
 *    - Öffnet Richtung "freie Seite" (weg vom Rand)
 * 
 * 3. Stack-Modus: Vertikale Anordnung
 *    - Fallback wenn sehr wenig Platz
 *    - Kinder untereinander neben dem Parent
 * 
 * COLLISION AVOIDANCE:
 * - Prüft Bounding Boxes gegen Viewport-Grenzen
 * - Bei Overlap: Winkel rotieren oder Modus wechseln
 */

/**
 * Berechnet Mindmap-Layout für Childnode-Tiles
 * @param {Object} parentRect - {x, y, width, height} des Parent-Tiles (Zentrum)
 * @param {number} childCount - Anzahl der Childnodes
 * @param {Object} viewportRect - {width, height} des Viewports
 * @param {string} preferredMode - 'ring' | 'halfring' | 'stack'
 * @returns {Array<{x: number, y: number, angle: number}>} Positionen relativ zum Parent-Zentrum (in %)
 */
export function computeMindmapLayout(parentRect, childCount, viewportRect, preferredMode = 'ring') {
    if (childCount === 0) return [];
    
    // CSS-Variable für Ring-Radius auslesen oder Default
    const rootStyles = getComputedStyle(document.documentElement);
    const ringRadiusPx = parseFloat(rootStyles.getPropertyValue('--childnode-ring-radius')) || 50;
    
    // Ring-Radius als Prozent der Parent-Tile-Größe
    // WICHTIG: Kleinerer Wert = Childnodes näher am Parent
    // Faktor 60 für ENGE Anordnung direkt am Parent
    const ringRadiusPercent = (ringRadiusPx / (parentRect.width / 2)) * 60;
    
    // Bestimme den besten Modus basierend auf Viewport-Constraints
    const mode = determineLayoutMode(parentRect, viewportRect, ringRadiusPx, preferredMode);
    
    // Berechne Positionen basierend auf Modus
    switch (mode) {
        case 'halfring':
            return computeHalfringLayout(parentRect, childCount, viewportRect, ringRadiusPercent);
        case 'stack':
            return computeStackLayout(parentRect, childCount, viewportRect);
        case 'ring':
        default:
            return computeRingLayout(parentRect, childCount, ringRadiusPercent);
    }
}

/**
 * Bestimmt den optimalen Layout-Modus basierend auf verfügbarem Platz
 * COLLISION AVOIDANCE LOGIC
 */
function determineLayoutMode(parentRect, viewportRect, ringRadius, preferredMode) {
    // Sicherheitsabstand zum Viewport-Rand (10% der kleineren Dimension)
    const margin = Math.min(viewportRect.width, viewportRect.height) * 0.1;
    
    // Parent-Position im Viewport (0-1)
    const parentRelX = parentRect.x / viewportRect.width;
    const parentRelY = parentRect.y / viewportRect.height;
    
    // Prüfe Abstände zu Rändern
    const distToLeft = parentRect.x - ringRadius;
    const distToRight = viewportRect.width - parentRect.x - ringRadius;
    const distToTop = parentRect.y - ringRadius;
    const distToBottom = viewportRect.height - parentRect.y - ringRadius;
    
    // HEURISTIK: Wenn Parent zu nah am Rand für vollen Ring
    const needsHalfring = distToLeft < margin || distToRight < margin || 
                          distToTop < margin || distToBottom < margin;
    
    // HEURISTIK: Wenn extrem wenig Platz → Stack
    const needsStack = (distToLeft < margin && distToRight < margin) ||
                       (distToTop < margin && distToBottom < margin);
    
    if (needsStack) {
        return 'stack';
    } else if (needsHalfring && preferredMode !== 'ring') {
        return 'halfring';
    }
    
    return preferredMode;
}

/**
 * Ring-Layout: Kinder gleichmäßig auf Kreis verteilt
 * Startet bei -90° (oben) für visuelle Balance
 */
function computeRingLayout(parentRect, childCount, radiusPercent) {
    const positions = [];
    const startAngle = -Math.PI / 2; // Beginne oben (12 Uhr Position)
    
    for (let i = 0; i < childCount; i++) {
        // Gleichmäßige Verteilung auf Vollkreis
        const angle = startAngle + (i / childCount) * 2 * Math.PI;
        
        // Position als Prozent relativ zum Parent-Zentrum
        const x = Math.cos(angle) * radiusPercent;
        const y = Math.sin(angle) * radiusPercent;
        
        positions.push({ x, y, angle });
    }
    
    return positions;
}

/**
 * Halbkreis-Layout: Kinder auf einem 180°-Bogen
 * Öffnet Richtung "freie Seite" basierend auf Parent-Position
 */
function computeHalfringLayout(parentRect, childCount, viewportRect, radiusPercent) {
    const positions = [];
    
    // Bestimme Öffnungsrichtung basierend auf Parent-Position
    // HEURISTIK: Öffne weg vom nächsten Rand
    const centerX = viewportRect.width / 2;
    const centerY = viewportRect.height / 2;
    
    // Basiswinkel: zeigt weg vom Viewport-Zentrum (nach außen)
    // Dann invertieren → zeigt zur freien Seite (weg vom Rand)
    let baseAngle = Math.atan2(parentRect.y - centerY, parentRect.x - centerX);
    baseAngle += Math.PI; // Invertieren: weg vom Rand
    
    // Spread über 160° (etwas weniger als Halbkreis für Ästhetik)
    const spreadAngle = Math.PI * 0.9;
    const startAngle = baseAngle - spreadAngle / 2;
    
    for (let i = 0; i < childCount; i++) {
        // Gleichmäßige Verteilung auf Halbkreis
        const progress = childCount > 1 ? i / (childCount - 1) : 0.5;
        const angle = startAngle + progress * spreadAngle;
        
        const x = Math.cos(angle) * radiusPercent;
        const y = Math.sin(angle) * radiusPercent;
        
        positions.push({ x, y, angle });
    }
    
    return positions;
}

/**
 * Stack-Layout: Vertikale Anordnung neben dem Parent
 * Fallback für sehr enge Platzverhältnisse
 */
function computeStackLayout(parentRect, childCount, viewportRect) {
    const positions = [];
    
    // Bestimme Seite: rechts wenn Parent links von Mitte, sonst links
    const isLeftSide = parentRect.x < viewportRect.width / 2;
    const xOffset = isLeftSide ? 120 : -120; // 120% der Parent-Größe
    
    // Vertikale Verteilung, zentriert um Parent
    const spacing = 60; // 60% der Parent-Größe pro Kind
    const totalHeight = (childCount - 1) * spacing;
    const startY = -totalHeight / 2;
    
    for (let i = 0; i < childCount; i++) {
        const x = xOffset;
        const y = startY + i * spacing;
        const angle = isLeftSide ? 0 : Math.PI; // 0° = rechts, 180° = links
        
        positions.push({ x, y, angle });
    }
    
    return positions;
}

/**
 * Prüft Kollision zwischen zwei Bounding Boxes
 * @param {Object} box1 - {x, y, width, height}
 * @param {Object} box2 - {x, y, width, height}
 * @returns {boolean} true wenn Kollision
 */
export function checkCollision(box1, box2) {
    return !(box1.x + box1.width < box2.x ||
             box2.x + box2.width < box1.x ||
             box1.y + box1.height < box2.y ||
             box2.y + box2.height < box1.y);
}

/**
 * Prüft ob Box innerhalb des Viewports liegt
 * @param {Object} box - {x, y, width, height}
 * @param {Object} viewport - {width, height}
 * @param {number} margin - Sicherheitsabstand zum Rand
 * @returns {boolean} true wenn komplett im Viewport
 */
export function isInsideViewport(box, viewport, margin = 0) {
    return box.x >= margin &&
           box.y >= margin &&
           box.x + box.width <= viewport.width - margin &&
           box.y + box.height <= viewport.height - margin;
}
