/**
 * Menu Layout Engine
 * Berechnet responsive Layout-Werte und wendet sie auf CSS an
 * 
 * LAYOUT COMPUTATION ENGINE
 * - computeLayout() berechnet alle Werte basierend auf Viewport
 * - applyLayoutToCSS() wendet Werte auf CSS Custom Properties an
 * - updateTilePositions() platziert Tiles kreisförmig
 */

/**
 * Berechnet responsive Layout-Werte basierend auf Viewport
 * @param {number} viewportW - Viewport Breite in px
 * @param {number} viewportH - Viewport Höhe in px  
 * @param {number} tileCount - Anzahl der Tiles
 * @returns {Object} Layout-Konfiguration
 * 
 * BEISPIEL-WERTE:
 * - 1920×1080 (16:9): radius≈480px, tileSize≈155px
 * - 2560×1440 (16:9): radius≈640px, tileSize≈205px
 * - 3440×1440 (21:9): radius≈720px, tileSize≈215px (Ultrawide)
 * - 1280×720 (16:9):  radius≈320px, tileSize≈105px (Small)
 */
export function computeLayout(viewportW, viewportH, tileCount) {
    // Basis-Einheit: kleinere Dimension für konsistentes Verhalten
    const vmin = Math.min(viewportW, viewportH);
    const vmax = Math.max(viewportW, viewportH);
    
    // Aspect Ratio Detection
    const aspectRatio = viewportW / viewportH;
    const isUltrawide = aspectRatio > 2.0;      // 21:9 und breiter
    const isWide = aspectRatio > 1.6;            // 16:10 und breiter
    const isNarrow = aspectRatio < 1.4;          // Schmaler als 16:10
    const isPortrait = aspectRatio < 1.0;        // Hochformat
    
    // ===================================
    // RADIUS BERECHNUNG
    // Orientiert sich an min(vw, vh) mit Aspect-Anpassung
    // ===================================
    let radiusFactor = 0.28; // Basis: 28% von vmin
    
    if (isUltrawide) {
        // Ultrawide: Nutze mehr horizontalen Platz
        radiusFactor = 0.32;
    } else if (isNarrow || isPortrait) {
        // Schmal: Kompakter Kreis
        radiusFactor = 0.24;
    }
    
    // Clamp Radius: min 200px, max 45% von vmin
    const radius = Math.max(200, Math.min(vmin * radiusFactor, vmin * 0.45));
    
    // ===================================
    // TILE SIZE BERECHNUNG
    // Skaliert mit Viewport, bleibt proportional zum Radius
    // ===================================
    let tileSizeFactor = 0.14; // Basis: 14% von vmin
    
    if (isUltrawide) {
        tileSizeFactor = 0.12; // Etwas kleiner relativ auf Ultrawide
    } else if (isNarrow) {
        tileSizeFactor = 0.16; // Größer relativ auf schmalen Screens
    }
    
    // Clamp: min 90px, max 220px
    const tileSize = Math.max(90, Math.min(vmin * tileSizeFactor, 220));
    
    // ===================================
    // ASPECT RATIO STRETCH
    // Rein kreisförmige Anordnung (kein Stretch)
    // ===================================
    const aspectStretchX = 1;
    const aspectStretchY = 1;
    
    // ===================================
    // FONT SIZES - Fluid Typography
    // Alle Größen relativ zu vmin
    // ===================================
    const fontSizes = {
        title: Math.max(24, Math.min(vmin * 0.035, 56)),      // Menü-Titel
        tile: Math.max(14, Math.min(vmin * 0.022, 28)),       // Tile-Titel
        labelIdle: Math.max(10, Math.min(vmin * 0.012, 16)),  // Labels idle
        labelFocus: Math.max(20, Math.min(vmin * 0.04, 56)),  // Labels fokussiert
        body: Math.max(14, Math.min(vmin * 0.018, 22)),       // Body Text
    };
    
    // ===================================
    // SPACING TOKENS
    // 8px-basiertes System, skaliert mit Viewport
    // ===================================
    const spacingBase = Math.max(4, Math.min(vmin * 0.01, 16));
    const spacing = {
        space1: spacingBase * 0.5,   // 4-8px
        space2: spacingBase * 1,     // 8-16px
        space3: spacingBase * 1.5,   // 12-24px
        space4: spacingBase * 2,     // 16-32px
        space5: spacingBase * 3,     // 24-48px
        space6: spacingBase * 4,     // 32-64px
    };
    
    // ===================================
    // LABEL POSITIONING
    // Offset vom Tile, Gap zwischen Labels
    // ===================================
    const labelOffsets = {
        offsetX: spacing.space3,
        offsetY: spacing.space2,
        gap: spacing.space1,
    };
    
    // ===================================
    // CENTER POSITION
    // Optisch zentriert (leicht nach oben verschoben)
    // ===================================
    const containerSize = radius * 2 + tileSize + spacing.space6;
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;
    
    // ===================================
    // TILE POSITIONS (Kreisberechnung)
    // ===================================
    const tilePositions = [];
    for (let i = 0; i < tileCount; i++) {
        // Startwinkel bei -90° (oben), gleichmäßig verteilt
        const angle = (i / tileCount) * 2 * Math.PI - Math.PI / 2;
        
        // Position mit Aspect-Stretch
        const x = centerX + radius * aspectStretchX * Math.cos(angle);
        const y = centerY + radius * aspectStretchY * Math.sin(angle);
        
        tilePositions.push({ x, y, angle });
    }
    
    return {
        // Basis-Metriken
        viewportW,
        viewportH,
        aspectRatio,
        vmin,
        
        // Layout-Flags
        isUltrawide,
        isWide,
        isNarrow,
        isPortrait,
        
        // Dimensionen
        radius,
        tileSize,
        containerSize,
        
        // Aspect Stretch
        aspectStretchX,
        aspectStretchY,
        
        // Zentrum
        centerX,
        centerY,
        
        // Typography
        fontSizes,
        
        // Spacing
        spacing,
        
        // Label Offsets
        labelOffsets,
        
        // Tile Positionen
        tilePositions,
        
        // Debug Info
        debug: {
            config: `${viewportW}×${viewportH} (${aspectRatio.toFixed(2)})`,
            mode: isUltrawide ? 'ultrawide' : isNarrow ? 'narrow' : 'standard',
        }
    };
}

/**
 * Wendet Layout auf CSS Custom Properties an
 * @param {Object} layout - Layout von computeLayout()
 */
export function applyLayoutToCSS(layout) {
    const root = document.documentElement;
    
    // Radius und Tile Size
    root.style.setProperty('--menu-radius', `${layout.radius}px`);
    root.style.setProperty('--tile-size', `${layout.tileSize}px`);
    
    // Aspect Stretch
    root.style.setProperty('--aspect-stretch-x', layout.aspectStretchX);
    root.style.setProperty('--aspect-stretch-y', layout.aspectStretchY);
    
    // Font Sizes
    root.style.setProperty('--font-title', `${layout.fontSizes.title}px`);
    root.style.setProperty('--font-tile', `${layout.fontSizes.tile}px`);
    root.style.setProperty('--font-label-idle', `${layout.fontSizes.labelIdle}px`);
    root.style.setProperty('--font-label-focus', `${layout.fontSizes.labelFocus}px`);
    root.style.setProperty('--font-body', `${layout.fontSizes.body}px`);
    
    // Spacing
    root.style.setProperty('--space-1', `${layout.spacing.space1}px`);
    root.style.setProperty('--space-2', `${layout.spacing.space2}px`);
    root.style.setProperty('--space-3', `${layout.spacing.space3}px`);
    root.style.setProperty('--space-4', `${layout.spacing.space4}px`);
    root.style.setProperty('--space-5', `${layout.spacing.space5}px`);
    root.style.setProperty('--space-6', `${layout.spacing.space6}px`);
    
    // Label Offsets
    root.style.setProperty('--label-offset-x', `${layout.labelOffsets.offsetX}px`);
    root.style.setProperty('--label-gap', `${layout.labelOffsets.gap}px`);
    
    console.log(`[MenuLayout] Applied: ${layout.debug.config} [${layout.debug.mode}]`);
}

/**
 * Aktualisiert Tile-Positionen basierend auf Layout
 * @param {Object} layout - Layout von computeLayout()
 */
export function updateTilePositions(layout) {
    const tiles = document.querySelectorAll('.menu-tile');
    const halfTile = layout.tileSize / 2;
    
    tiles.forEach((tile, index) => {
        if (layout.tilePositions[index]) {
            const pos = layout.tilePositions[index];
            // Zentriere Tile auf berechneter Position
            tile.style.left = `${pos.x - halfTile}px`;
            tile.style.top = `${pos.y - halfTile}px`;
        }
    });
}

/**
 * Führt Layout-Update durch
 * @returns {Object} Aktualisiertes Layout
 */
export function updateLayout() {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const tileCount = document.querySelectorAll('.menu-tile').length || 5;
    
    // Berechne neues Layout
    const layout = computeLayout(viewportW, viewportH, tileCount);
    
    // Wende auf CSS an
    applyLayoutToCSS(layout);
    
    // Aktualisiere Tile-Positionen
    updateTilePositions(layout);
    
    return layout;
}
