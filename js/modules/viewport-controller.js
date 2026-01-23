/**
 * Viewport Controller Module (Refactored)
 * Wrapper für Camera Controller und Layout Engine
 * 
 * Bietet Backward Compatibility für bestehenden Code:
 * - getViewportController()  getCameraController()
 * - initViewportController()  initCameraController()
 * - computeMindmapLayout()  direkter Import von layout-engine.js
 */

// Re-export CameraController APIs for backward compatibility
export { 
    getCameraController as getViewportController,
    initCameraController as initViewportController
} from './camera-controller.js';

// Re-export layout engine functions
export { 
    computeMindmapLayout,
    checkCollision,
    isInsideViewport
} from './layout-engine.js';
