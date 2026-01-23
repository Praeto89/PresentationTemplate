# REFACTOR LOG (Conservative, Evidence-Based)

Date: 2026-01-10

## Added Structural Comments
- File: [index.html](index.html)
- Schema: `<!-- Slide X.Y | Kapitel | Zweck | optional ID -->`
- Scope: All static `section` elements including nested vertical slides
- Zero-risk policy: HTML comments only; no DOM structure, timing, event listeners, plugin hooks, or Reveal initialize order affected

### Slide Map (Order Preserved)
- [Slide 1.0 | Titel | Titel der Präsentation | title-slide](index.html#L12-L15)
- [Slide 2.0 | Übersicht | Themenübersicht (Kreisnavigation) | overview](index.html#L17-L20)
- [Slide 3.0–3.4 | Beweggründe | Gruppe + Vertikal Slides](index.html#L76-L115)
- [Slide 4.0–4.4 | Thesen | Gruppe + Vertikal Slides](index.html#L117-L156)
- [Slide 5.0–5.4 | Hermeneutik | Gruppe + Vertikal Slides](index.html#L158-L197)
- [Slide 6.0–6.4 | Ethik & Philosophie | Gruppe + Vertikal Slides](index.html#L199-L238)
- [Slide 7.0–7.4 | Felder & Dederich | Gruppe + Vertikal Slides](index.html#L240-L279)
- [Slide 8.0–8.4 | Ordnung der Erkenntnisse | Gruppe + Vertikal Slides](index.html#L281-L320)
- [Slide 9.0–9.4 | Beratung & Kooperation | Gruppe + Vertikal Slides](index.html#L322-L361)
- [Slide 10.0–10.4 | Praxisfolgen | Gruppe + Vertikal Slides](index.html#L363-L402)

Note: Line ranges are approximate and may shift as comments are added.

## Removal Candidates & Stakeholder Decisions

### KEPT: index-legacy.html (Legacy Entry – Not Referenced or Active)

**Technical Criteria Met for Removal**:
- Conclusively unused: No references in [index.html](index.html), [package.json](package.json), scripts, or workspace code
- Workspace searches: "index-legacy.html" → Keine Treffer across `.js`, `.html`, `.json`, configs
- Not in active presentation flow; fully isolated

**Why Kept (Organizational)**:
- Represents potential alternative entry point; may be referenced by external docs or prior integrations
- Removal is non-critical; presence causes no harm to active path
- Stakeholder clarification needed before deletion

**Decision**: **Removal blocked pending explicit stakeholder approval.** No modifications, integrations, or functional changes.

**Marker Added**: HTML comment at file top documenting legacy status and non-modifiable status.

---

### KEPT: Board Prototype – [src/board/app.js](src/board/app.js), [css/board.css](css/board.css) (Experimental)

**Technical Criteria Met for Removal**:
- Conclusively unused in active entry: No imports, mount points, HTML links, plugin registration
- Workspace searches:
  - "board.css": Keine Treffer outside own file
  - "src/board/app.js": Keine Treffer outside own file
  - "\bboard\b" (word boundary): Matches only within board files; no external references
- Standalone MVP; not integrated in [index.html](index.html), [src/presentation.js](src/presentation.js), or build scripts

**Why Kept (Organizational)**:
- Represents experimental/prototype work; may be relevant for future iterations, alternative features, or research continuance
- Removal is non-critical; clean code separation, no dependencies
- Stakeholder clarification needed on archiving vs. integration strategy

**Decision**: **Removal blocked pending stakeholder review.** Kept as experimental prototype. No refactoring, modification, or deletion without approval.

**Marker Added**: Header comment in [src/board/app.js](src/board/app.js) documenting experimental status and non-integrated state.

## Unklar / Kept
- Reveal Plugins folder [plugin/]: Kept. Not referenced by [index.html](index.html); used only in legacy architecture. Removal deferred to avoid accidental impact; requires broader confirmation.
- Config adapter [src/reveal/adapter.js] and [src/config.js]: Kept; not wired in current [index.html](index.html) flow but part of modular architecture. Removal deferred.

## Dynamic Slides
- No dynamic section creation detected in [src/presentation.js](src/presentation.js). Comments added only in static HTML. Zero-risk guarantee satisfied.
- If future dynamic generation is introduced, comment insertion will be limited to zero-risk creation sites.

## Verification Checklist
- Presentation starts from [index.html](index.html)
- Navigation intact per custom handlers in [src/presentation.js](src/presentation.js)
- Slides identifiable with consistent comments in [index.html](index.html)

### Removed: Custom CSS (Legacy)
- Paths:
  - [css/custom/admin.css](css/custom/admin.css)
  - [css/custom/animations.css](css/custom/animations.css)
  - [css/custom/menu.css](css/custom/menu.css)
  - [css/custom/transitions.css](css/custom/transitions.css)
- Criteria: Conclusively unused in active entry (`index.html`) and not referenced by build/deploy configs
- Searches performed:
  - Files searched: Full workspace including docs and configs
  - Terms: "css/custom/admin.css", "css/custom/animations.css", "css/custom/menu.css", "css/custom/transitions.css"
  - Results: Only referenced in documentation files ([README.md](README.md), [SCHNELLSTART.md](SCHNELLSTART.md)); no code, config, or HTML imports in active path
- Entry/Deploy Config Scan:
  - [package.json](package.json): No build/start/deploy scripts referencing legacy assets; only `postinstall` copying Reveal `dist/` and `plugin/`
  - No `vite.config`, `webpack`, `parcel`, `netlify.toml`, `vercel.json`, `Dockerfile`, or CI YAML present in workspace
- Decision: Removed due to hard evidence of non-usage in active path; documentation corrected accordingly

### Documentation Corrections
- Updated [README.md](README.md):
  - Added legacy note clarifying admin/menu features are not active in `index.html`
  - Replaced customization references from `css/custom/*` to [css/presentation.css](css/presentation.css)
- Updated [SCHNELLSTART.md](SCHNELLSTART.md):
  - Added legacy note at top
  - Replaced customization references from `css/custom/*` to [css/presentation.css](css/presentation.css)

