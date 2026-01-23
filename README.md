# Reveal.js Master Thesis Presentation

An interactive presentation built with Reveal.js featuring custom animations, circular tile navigation, mindmap-style sub-navigation, and an admin mode for content editing.

**Note**: The admin mode and circular menu described below refer to a legacy prototype (index-legacy.html) and are not active in the current entry (index.html). Active styles live in css/presentation.css.

## Features

- **Book Opening Animation**: 3D book flip effect with zoom transition to title slide
- **Circular Tile Menu**: Interactive main menu with topic tiles arranged in a circle
- **Mindmap Sub-Navigation**: Childnode tiles orbit around parent tiles with curved SVG connections
- **Book Page Container**: Paper-like page design with Satzspiegel (typographic margins)
- **Spiral Zoom Transitions**: Custom animations with color theme changes (green to soft blue)
- **Bookmark Persistence**: Mark important subtopics, saved in localStorage
- **Admin Mode**: Edit tiles and content directly in the browser with local file persistence
- **Closing Animation**: Book closing effect with thank you message
- **Offline Support**: Fully functional without internet connection
- **Responsive Design**: Optimized for 16:9 and ultrawide displays

## New Mindmap Features

### Childnode Tiles
- Subtopics appear as small tile satellites around each parent topic
- Ring layout (default), half-ring (near edges), or stack (tight spaces)
- Collision avoidance prevents overlap with viewport edges

### SVG Connection Lines  
- Curved Bézier paths connect parent to children
- Animated draw effect on focus (stroke-dashoffset)
- Subtle in idle, prominent when focused

### Bookmark System
- Toggle bookmark icon on any childnode tile
- Bookmarks persist via localStorage
- Visual indicator (red accent) for bookmarked items

### Book Page Design
- `.book-shell` outer frame with subtle background
- `.book-page` container with paper texture, soft shadows
- `.book-gutter` center fold line (visible on large screens)
- Serif typography option via `--font-book` variable

## Project Structure

```
reveal-thesis-presentation/
├── index.html              # Main presentation file
├── package.json            # Node.js dependencies
├── css/
│   └── custom/
│       ├── animations.css  # Book flip, zoom, and mindmap line animations
│       ├── transitions.css # Spiral zoom and color transitions
│       └── menu.css        # Circular menu, childnode tiles, book container
├── js/
│   └── modules/
│       ├── menu.js         # Tile rendering, childnode positioning, SVG lines
│       ├── viewport-controller.js # State machine, computeMindmapLayout()
│       ├── admin.js        # Admin mode functionality
│       ├── storage.js      # File operations, bookmark persistence
│       └── navigation.js   # Custom navigation logic
├── assets/
│   └── images/             # Optimized images and textures
├── data/
│   └── content.json        # Editable content structure (topics, subtopics)
├── dist/                   # Reveal.js core files (generated)
└── plugin/                 # Reveal.js plugins (generated)
```

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
   This will download Reveal.js and copy necessary files to `dist/` and `plugin/` directories.

## Usage

### Running Locally

Simply open `index.html` in a modern web browser (Chrome, Edge, Firefox, Safari).

For development with live reload, use a local server:
```bash
npx serve
```
or use VS Code's Live Server extension.

### Offline Use on Other Devices

1. Copy the entire `reveal-thesis-presentation` folder to the target device
2. Ensure `dist/` and `plugin/` folders are included
3. Open `index.html` in any modern browser

No internet connection required!

### Admin Mode

Activate admin mode to edit content:

1. **Via URL**: Add `?mode=admin` to the URL (e.g., `index.html?mode=admin`)
2. **Via Keyboard**: Press `Ctrl+E` during the presentation

In admin mode:
- Click on tiles or text to edit content
- Changes are saved to `data/content.json`
- Use Export/Import buttons to backup content

**Note**: Modern browsers (Chrome, Edge) support direct file editing. Firefox and Safari use download/upload for content persistence.

## Navigation

- **Arrow Keys**: Navigate between slides (standard Reveal.js)
- **Click Tiles**: Jump directly to topic content
- **Menu Button**: Return to circular main menu (available on content slides)
- **Esc**: Overview mode

## Deployment to GitHub Pages

1. Create a new repository on GitHub
2. Add remote and push:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```
3. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Select "Deploy from branch"
   - Choose `main` branch and `/ (root)` folder
   - Save and wait for deployment

Your presentation will be available at: `https://yourusername.github.io/your-repo-name/`

## Browser Compatibility

- **Chrome/Edge**: Full support including File System Access API
- **Firefox**: Full support with download/upload fallback for admin mode
- **Safari**: Full support with download/upload fallback for admin mode

## Customization

- **Colors**: Edit CSS variables in `css/presentation.css`
- **Book Design**: Adjust paper colors and shadows in `css/presentation.css` (book page selectors)
- **Childnode Layout**: Modify `--childnode-*` variables for size and spacing
- **Animations**: Modify keyframes in `css/presentation.css` (keyframes and transitions)
- **Layout Algorithm**: Edit `computeMindmapLayout()` in `js/modules/viewport-controller.js`
- **Tile Count**: Adjust circle calculations in `js/modules/menu.js`
- **Content**: Edit `data/content.json` or use admin mode

### Key CSS Variables

```css
/* Book Page Design */
--paper-bg: #fdfbf7;           /* Paper background color */
--paper-shadow: ...;           /* Multi-layer page shadow */
--font-book: 'Crimson Text', serif; /* Book typography */

/* Mindmap Childnodes */
--childnode-size-idle: clamp(28px, 4vmin, 48px);
--childnode-size-focus: clamp(60px, 10vmin, 120px);
--childnode-ring-radius: clamp(60px, 12vmin, 140px);

/* Connection Lines */
--line-color-idle: rgba(44, 62, 80, 0.15);
--line-color-focus: rgba(44, 62, 80, 0.5);
```

## License

MIT License - Feel free to use and modify for your thesis presentation.
