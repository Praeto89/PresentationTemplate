# Deprecated Modules & Migration Guide

## Deprecated Modules

### `js/modules/admin.js` ⚠️ DEPRECATED
**Status**: Not used in production  
**Replacement**: Use `js/modules/edit-mode.js` instead  
**Last Used**: Prior to unified Edit Mode refactoring  
**Migration Path**: All admin functionality is now in `initEditMode()` from edit-mode.js

**What Changed**:
- `initAdmin()` → `initEditMode()` (from edit-mode.js)
- `toggleAdminMode()` → Built into edit-mode.js
- `setupAdminControls()` → Integrated into edit-mode.js

**Why it exists**:
- Kept for historical reference and potential backwards compatibility
- Clean code separation means no hard dependencies
- Safe to remove if no legacy imports exist

**How to Remove** (if needed):
1. Verify no files import from admin.js:
   ```bash
   grep -r "import.*admin\.js" .
   grep -r "from.*admin\.js" .
   ```
2. Delete `js/modules/admin.js`
3. Update documentation references

---

## Other Kept-But-Experimental Modules

### `src/board/app.js` 🔬 EXPERIMENTAL
- Board prototype/MVP
- Not integrated into main presentation
- Kept for future iterations or research
- Status: Standalone, no dependencies

---

## Configuration Consolidation

### Files to be aware of:
- `src/config.js` - App bootstrap config (Reveal.js)
- `js/modules/config/constants.js` - Application constants (animations, storage keys, etc.)

**Current Structure**:
- Not yet consolidated (planned refactoring)
- Both serve different purposes currently
- Low priority for consolidation

**Future Recommendation**:
- Merge into single `js/config/index.js` when refactoring UI modules
- Export submodules: `CONFIG.reveal`, `CONFIG.animations`, `CONFIG.storage`

