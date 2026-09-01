# Project Guidelines & Rules

## Hyperlink Policy
- **Never create hyperlinks to lessons that are in the same chapter.**
- In-text hyperlinks are reserved strictly for cross-connecting concepts and articles belonging to **different chapters** (which feeds into the cross-chapter knowledge graph on the main page).

## Mathematical Equation Formatting Policy
- **No Wide Single-Line Equations (Avoid Horizontal Scrolling):** Never construct long, single-line mathematical equations that exceed the standard reading container width on desktop or mobile.
- **Multi-Line Alignment (`aligned`):** Whenever an equation contains intermediate steps, multiple matrices, outer products, or long expressions, always split it across multiple lines using `\begin{aligned} ... \end{aligned}` (with aligned operators `&=` and row spacing `\\[6pt]` or `\\[8pt]`). This ensures terms wrap and flow cleanly to the next line rather than triggering horizontal scrollbars.

## Visual & Diagram Presentation Policy
- **No Enclosing Card Frames or Canvas Boxes:** Never wrap visual diagrams, figures, or interactive widgets in cards, bounding boxes, grey frames, or distinct background panels. All diagrams must blend seamlessly with the reading page background.
- **No Canvas Elements for Diagrams (Prefer Seamless Interactive SVG):** Use clean vector SVG representations that sit directly on the page body. If interactive 3D rotation is required, manipulate the SVG elements directly via JavaScript projection updates on drag, avoiding HTML5 `<canvas>` elements and toolbar frames.
- **No Text Collisions / Overlapping Labels:** Ensure generous spacing, dynamic label offsets, and clean typography so lines, points, planes, and annotations remain legible in all viewport configurations and themes.
