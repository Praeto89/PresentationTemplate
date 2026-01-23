# Feature Map

Quelle: aktueller Code (Stand 2025-12-26).

## Presentation Shell / Slides
- Intro Book Opening (`index.html` section `#intro`, CSS `css/custom/animations.css`): 3D Buch-Flip mit Titel/Autor.
- Main Menu Camera Viewport (`index.html` section `#main-menu`, `.camera-viewport`): einziger Transform-Wrapper für Menü/Mindmap.
- Legacy Topic Stacks (`index.html` sections `#topic-1..6`, hidden): vertikale Slides je Topic, Buttons `Reveal.slide(1,0)` als Fallback.
- Closing Book Animation (`index.html` section `#closing`, button `#close-book-btn`): Buch schließen, Rückkehr zum Menü.
- Admin Overlay (`#admin-overlay` in `index.html`, styling `css/custom/admin.css`).

## Reveal Initialization
- Inline init in `index.html` (module script): `Reveal.initialize` mit hash/size/settings, plugins `[RevealMarkdown, RevealHighlight, RevealNotes]`; awaits ready, then loads content and modules.
- Navigation lock/unlock via `Reveal.configure({ keyboard: false/true })` inside `viewport-controller.js` during focus/unfocus.
- Navigation helpers: `navigation.js` calls `Reveal.slide` for menu/closing/topic.

## Menu & Mindmap System
- Circular Parent Tiles (`menu.js`: `computeLayout`, `applyLayoutToCSS`, `initMenu`): radius/tile size responsive, ellipse support; tiles positioned with inline styles.
- Mindmap Child Tiles (`menu.js`: creation in `initMenu`, positioning via `positionChildnodeTiles` + `computeMindmapLayout` from `viewport-controller.js`): ring/half-ring/stack heuristics, per-parent SVG Bézier lines `updateMindmapLines` into `#mindmap-lines`.
- Hover/Focus states (`menu.js`: `updateTileVisibilityByState`, `updateMindmapStateClass`): data attributes and classes; glow hover effect idle only.
- Bookmark persistence (`storage.js`: `getBookmarks`, `toggleBookmarkStorage`; `menu.js`: `toggleBookmark`, `restoreBookmarks`): localStorage key `thesis-presentation-bookmarks`, button per child tile.
- Return handling (`menu.js`: global return button data-action unfocus).

## Viewport / Camera Motion
- State machine in `viewport-controller.js`: states `idle → focusing → focused → returning`; guards against concurrent animations; exposes `focusTile`, `unfocus`, `getCurrentState`, listeners `onStateChange`/`onAnimationEvent`.
- Motion: zoom-in/out durations (800/500ms), easeOutExpo; reduced-motion instant paths; animations currently mostly CSS-driven (methods log phases).
- Keyboard guard: disables Reveal keyboard during focus, re-enables after unfocus.

## Navigation Layer
- Keyboard handling (`navigation.js`: `handleKeyboardNavigation`): ESC triggers unfocus when focused; blocks navigation during non-idle; Home/H and End navigate via `Reveal.slide`; return/back helper `handleBackAction`.
- Closing/book controls (`navigation.js`: `closeBook`, `reopenBook`), menu return `returnToMainMenu`, topic navigation `navigateToTopic` (legacy).

## Content Loading & Persistence
- Data fetch (`storage.js`: `loadContent`): fetch `data/content.json`, fallback extracts from DOM if fetch fails; sets menu content via `setContentData` and updates HTML titles/closing message.
- Save/import (`storage.js`: `saveContent`/`importContent`): File System Access API with download/upload fallback; JSON stringify with indentation.
- Admin integration (`storage.js`: `handleFileInputChange`, `updateContentData`, `getContentData`).

## Admin Mode
- Activation (`admin.js`: URL `?mode=admin` or Ctrl+E toggle), overlay show/hide, `setEditMode` for tiles.
- Editable fields: intro title/subtitle/author, closing message, legacy topic titles/contents (contentEditable); collects changes back into `contentData` (`collectChanges`).
- Export/Import buttons wired to storage layer.

## Layout & Styling (current)
- CSS custom props for book, menu, animations (`css/custom/{animations,transitions,menu,admin}.css`).
- Mindmap line styling in `menu.css`; animations for draw effects in `animations.css`.
- Typo/layout tokens currently scattered across custom CSS files; not centralized yet.

## Performance / Accessibility
- Prefers-reduced-motion honored in `viewport-controller.js` (instant zoom paths).
- SVG lines are `aria-hidden`; keyboard navigation mostly blocked during focus to avoid Reveal slide change.

## Known Fallback/Legacy Paths
- Legacy topic vertical stacks still present but hidden; `navigateToTopic` still calls `Reveal.slide`.
- Detail panels hinted as TODO in `menu.js` (`handleChildnodeClick` placeholder for content navigation).