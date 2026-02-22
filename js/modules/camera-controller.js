/**
 * Camera Controller Module
 * State Machine für Zoom-Camera-Motion beim Menü-Navigation
 * 
 * States: idle → focusing → focused → returning → idle
 * Verwaltet CSS Custom Properties für Transform, Scale, Blur, Opacity
 */

import { clamp } from './utils/math.js';
import { ANIMATIONS, LAYOUT } from '../config/index.js';

class CameraController {
    constructor() {
        // State Management
        this.currentState = 'idle'; // idle | focusing | focused | returning
        this.focusedTileId = null;
        this.focusedTileElement = null;
        
        // Animation Timing
        this.zoomInDuration = ANIMATIONS.zoomIn;
        this.zoomOutDuration = ANIMATIONS.zoomOut;
        this.focusScaleBias = LAYOUT.focusScaleBias;
        
        // Animation State
        this.animationInProgress = false;
        this.activeAnimationCancel = null;
        this.cameraTransform = { scale: 1, tx: 0, ty: 0 };
        
        // Event Handlers
        this.stateChangeListeners = [];
        this.animationListeners = [];
        
        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Initialize CSS Custom Properties
        this.initCSSProperties();
    }

    /**
     * Initialisiert CSS Custom Properties für alle States
     * VEREINFACHT: Labels werden jetzt via data-focused CSS gesteuert
     */
    initCSSProperties() {
        const root = document.documentElement;
        root.style.setProperty('--cam-scale', '1');
        root.style.setProperty('--cam-x', '0px');
        root.style.setProperty('--cam-y', '0px');
        console.log('[Camera] Initialized - camera vars primed');
    }

    /**
     * Fokussiere einen Menüpunkt mit Zoom-Animation
     * KEIN Reveal.slide() mehr - Animation bleibt im selben Slide
     * @param {number} tileId - Topic ID
     * @param {HTMLElement} tileElement - Das Tile-DOM-Element
     */
    focusTile(tileId, tileElement) {
        if (this.animationInProgress) {
            console.warn('[Camera] Animation already in progress');
            return;
        }

        if (this.currentState !== 'idle') {
            console.warn(`[Camera] Cannot focus: current state is ${this.currentState}`);
            return;
        }

        // Debug: Log animation start mit Timestamp
        console.log(`[Camera] focusTile(${tileId}) started at`, performance.now().toFixed(2), 'ms');

        this.focusedTileId = tileId;
        this.focusedTileElement = tileElement;
        this.currentState = 'focusing';
        this.animationInProgress = true;
        
        // Keyboard-Lock: Verhindere Reveal.js Navigation während Fokus
        // Pfeiltasten sollen nicht zu anderen Slides wechseln
        if (typeof Reveal !== 'undefined') {
            Reveal.configure({ keyboard: false });
            console.log('[Camera] Reveal keyboard disabled');
        }

        // Notify listeners
        this.notifyStateChange('focusing');
        this.notifyAnimationStart('zoom-in');

        const cameraTarget = this.computeCameraTarget(tileElement);
        const from = { ...this.cameraTransform };
        const to = cameraTarget;

        if (this.prefersReducedMotion) {
            this.applyCameraTransform(to);
            this.finishFocus();
            return;
        }

        this.runCameraAnimation({
            from,
            to,
            duration: this.zoomInDuration,
            onComplete: () => this.finishFocus()
        });
    }

    /**
     * Beende Focus-Animation
     * State: focusing → focused
     */
    finishFocus() {
        console.log('[Camera] Focus animation complete');
        this.currentState = 'focused';
        this.notifyStateChange('focused');
        this.notifyAnimationEnd('zoom-in');
    }

    /**
     * Starten Sie die Unfocus-Animation
     * State: focused → returning → idle
     */
    unfocus() {
        if (this.currentState !== 'focused') {
            console.warn(`[Camera] Cannot unfocus: current state is ${this.currentState}`);
            return;
        }

        console.log('[Camera] unfocus() triggered');
        this.currentState = 'returning';
        this.notifyStateChange('returning');
        this.notifyAnimationStart('zoom-out');

        const from = { ...this.cameraTransform };
        const to = { scale: 1, tx: 0, ty: 0 }; // Reset to identity

        if (this.prefersReducedMotion) {
            this.applyCameraTransform(to);
            this.finishUnfocus();
            return;
        }

        this.runCameraAnimation({
            from,
            to,
            duration: this.zoomOutDuration,
            onComplete: () => this.finishUnfocus()
        });
    }

    /**
     * Beende Unfocus-Animation
     * State: returning → idle
     */
    finishUnfocus() {
        console.log('[Camera] Unfocus animation complete');
        this.currentState = 'idle';
        this.focusedTileId = null;
        this.focusedTileElement = null;
        this.animationInProgress = false;
        this.notifyStateChange('idle');
        this.notifyAnimationEnd('zoom-out');
        
        // Re-enable Reveal.js navigation
        if (typeof Reveal !== 'undefined') {
            Reveal.configure({ keyboard: true });
            console.log('[Camera] Reveal keyboard re-enabled');
        }
    }

    easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    /**
     * Berechnet Camera-Target für ein Tile
     * @param {HTMLElement} tileElement - Das zu fokussierende Tile
     * @returns {{scale: number, tx: number, ty: number}} Camera-Transformation
     */
    computeCameraTarget(tileElement) {
        const targetRect = tileElement.getBoundingClientRect();
        const viewportRect = this.getViewportRect();
        const focusScaleBias = this.focusScaleBias;

        const viewportWidth = viewportRect.width || window.innerWidth;
        const viewportHeight = viewportRect.height || window.innerHeight;
        const viewportLeft = viewportRect.left || 0;
        const viewportTop = viewportRect.top || 0;

        const targetCenterX = targetRect.left - viewportLeft + targetRect.width / 2;
        const targetCenterY = targetRect.top - viewportTop + targetRect.height / 2;

        const targetWidth = targetRect.width || 1;
        const targetHeight = targetRect.height || 1;

        const desiredScale = Math.min(
            viewportWidth / (targetWidth * focusScaleBias),
            viewportHeight / (targetHeight * focusScaleBias)
        );

        const scale = clamp(desiredScale, LAYOUT.minZoom, LAYOUT.maxZoom);
        const viewportCenterX = viewportWidth / 2;
        const viewportCenterY = viewportHeight / 2;

        // translate is applied before scale → divide offset by scale
        const dx = viewportCenterX - targetCenterX;
        const dy = viewportCenterY - targetCenterY;
        const tx = dx / scale;
        const ty = dy / scale;

        return { scale, tx, ty };
    }

    /**
     * Gets the viewport rect (typically the Reveal.js viewport)
     * @returns {{width: number, height: number, left: number, top: number}}
     */
    getViewportRect() {
        const revealViewport = document.querySelector('.reveal .viewport');
        if (revealViewport) {
            return revealViewport.getBoundingClientRect();
        }
        // Fallback to window
        return { 
            width: window.innerWidth, 
            height: window.innerHeight,
            left: 0,
            top: 0
        };
    }

    /**
     * Applies camera transform to DOM via CSS Custom Properties
     * @param {{scale: number, tx: number, ty: number}} transform
     */
    applyCameraTransform({ scale, tx, ty }) {
        this.cameraTransform = { scale, tx, ty };
        const root = document.documentElement;
        root.style.setProperty('--cam-scale', scale);
        root.style.setProperty('--cam-x', `${tx}px`);
        root.style.setProperty('--cam-y', `${ty}px`);
    }

    /**
     * Führt Zoom-Animation mit easing aus
     * @param {{from: Object, to: Object, duration: number, onUpdate: function, onComplete: function}} config
     */
    runCameraAnimation({ from, to, duration, onUpdate, onComplete }) {
        const startTime = performance.now();
        const lastFrameTime = startTime;

        const animationLoop = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Apply easing to progress
            const easedProgress = this.easeOutExpo(progress);

            // Interpolate transform values
            const scale = lerp(from.scale, to.scale, easedProgress);
            const tx = lerp(from.tx, to.tx, easedProgress);
            const ty = lerp(from.ty, to.ty, easedProgress);

            // Apply to DOM
            this.applyCameraTransform({ scale, tx, ty });

            // Callback for external updates
            if (onUpdate) onUpdate({ scale, tx, ty });

            // Continue animation or finish
            if (progress < 1) {
                this.activeAnimationCancel = requestAnimationFrame(animationLoop);
            } else {
                this.applyCameraTransform(to);
                this.animationInProgress = false;
                if (onComplete) onComplete();
            }
        };

        this.activeAnimationCancel = requestAnimationFrame(animationLoop);
    }

    // ==============================
    // Event System
    // ==============================

    /**
     * Suscribe zu State-Change Events
     * @param {function} callback - (newState: string) => void
     */
    onStateChange(callback) {
        this.stateChangeListeners.push(callback);
    }

    notifyStateChange(newState) {
        this.stateChangeListeners.forEach(cb => cb(newState, this.focusedTileId));
    }

    /**
     * Subscribe zu Animation Events
     * @param {function} callback - (type: string, event: string) => void
     */
    onAnimationEvent(callback) {
        this.animationListeners.push(callback);
    }

    notifyAnimationStart(animationType) {
        this.animationListeners.forEach(cb => cb(animationType, 'start'));
    }

    notifyAnimationEnd(animationType) {
        this.animationListeners.forEach(cb => cb(animationType, 'end'));
    }

    // ==============================
    // State Queries
    // ==============================

    /**
     * Get current state
     * @returns {string} 'idle' | 'focusing' | 'focused' | 'returning'
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * Check if camera is currently animating
     * @returns {boolean}
     */
    isAnimating() {
        return this.animationInProgress;
    }

    /**
     * Get focused tile ID
     * @returns {number|null}
     */
    getFocusedTileId() {
        return this.focusedTileId;
    }

    /**
     * Get current camera transform
     * @returns {{scale: number, tx: number, ty: number}}
     */
    getCameraTransform() {
        return { ...this.cameraTransform };
    }
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Singleton Instance
let instance = null;

/**
 * Get or create the CameraController singleton
 */
export function getCameraController() {
    if (!instance) {
        instance = new CameraController();
    }
    return instance;
}

/**
 * Initialize the CameraController
 */
export function initCameraController() {
    return getCameraController();
}
