# Project Guidelines & Rules

## Pedagogical Philosophy & Writing Style Guide

The library "Connecting the Dots" is built on the principle that **true understanding comes from discovering ideas from first principles, guided by intuition and driven by questions**.

### 1. Narrative Arc: Question-Driven Storytelling
- **Never Introduce a Formula Without a Motivation:** Every equation, algorithm, or theorem must answer a specific, intuitive dilemma or breakdown of previous tools.
- **Sequential Unfolding:** Concepts must progress naturally in a logical chain:
  1. *The Obstruction:* Where does our current understanding or previous method break down? (e.g., "Linear PCA fails on curved data").
  2. *The Geometric / Intuitive Insight:* What is the physical or visual intuition that could solve it? (e.g., "Lifting into higher dimensions turns curves into flat hyperplanes").
  3. *The Catch / Computational Bottleneck:* What practical issue arises when trying the naive solution? (e.g., "Feature dimensions explode combinatorially").
  4. *The Breakthrough:* How do we elegantly bypass the bottleneck? (e.g., "The Kernel Trick — inner products in disguise").
  5. *The Rigorous Synthesis:* Complete derivation, validation theorems (e.g., Mercer's condition), centering, and algorithmic steps.
- **Constant Dialogical Rhythm:** Use proactive rhetorical questions ("Why does this happen?", "What is the physical meaning of this?", "How do we compute what we cannot see?") to keep the reader active and curious.

### 2. Narrative Opening (Never Begin with a Definition Box)
- **Never open an article with a definition box, key box, or formal summary at the very top.**
- Articles must always begin directly with engaging narrative prose, intuition, and motivating questions that draw the reader into the problem and establish why we care.

### 3. Box Usage Policy: Definitions vs. Guiding Questions
- **Definition / Theorem Boxes (`math-box` with `math-box-label`):**
  - Reserved **strictly** for formal mathematical definitions, theorems, or named algorithmic mechanisms (e.g. *The Kernel Function & Kernel Trick*, *Mercer's Theorem*, *The Centered Kernel Matrix*).
  - Do not use labeled definition boxes for informal prose or general explanations.
- **Guiding / Intuitive Question Boxes (`math-box` with centered italicized body):**
  - Place pivotal rhetorical questions that lead from one concept to the next inside a standalone centered box (`<div class="math-box"><div class="math-box-body" style="text-align: center;"><p><em>...</em></p></div></div>`).
  - This marks key conceptual hurdles (e.g., *"How can we enable linear methods to capture non-linear dependencies?"*, *"Can we compute inner products of high-dimensional combination features without calculating coordinates?"*, *"How do we center points in Hilbert space that we cannot see?"*) and anchors the reader's curiosity before delivering the breakthrough.

### 3. Concrete Grounding Before General Abstraction
- Ground abstract concepts in tangible, simple, low-dimensional examples with real numbers or clear geometric coordinates before generalizing to $n$ dimensions.
- Walk through actual numerical evaluations so the reader sees the arithmetic in action before dealing with general matrix calculus.

### 4. Mathematical Equation Formatting & Multi-Line Wrapping Policy
- **Strict Prohibition of Horizontal Math Scrolling (Zero Horizontal Overflow):** Under no circumstances may a mathematical equation exceed the reading container width or trigger a horizontal scrollbar on desktop or mobile. Equations must proactively wrap and move to the next line before approaching the container margin.
- **Mandatory Multi-Line Breakdown for Chained Equalities:**
  - **Never chain multiple equality steps horizontally on a single line** (e.g. $A = B = C = D$).
  - Every single algebraic expansion, substitution, or simplification step **must** be broken onto its own line using `\begin{aligned} ... \end{aligned}` with aligned operators `&=` and generous vertical row spacing (`\\[6pt]` or `\\[8pt]`).
  - *Example Pattern:*
    $$\begin{aligned}
      \operatorname{MSE}(\hat{p}_{\text{new}}) &= \operatorname{Var}(\hat{p}_{\text{new}}) + \operatorname{Bias}(\hat{p}_{\text{new}})^2 \\[6pt]
      &= \frac{np(1 - p)}{(n + 2)^2} + \frac{(1 - 2p)^2}{(n + 2)^2} \\[8pt]
      &= \frac{np - np^2 + 1 - 4p + 4p^2}{(n + 2)^2} \\[8pt]
      &= \frac{p(1 - p)(n - 4) + 1}{(n + 2)^2}
    \end{aligned}$$
- **No Horizontal Stacking with `\qquad` or Commas:** Never cram multiple related formulas or parameter evaluations side-by-side across a single line (e.g. `\operatorname{Bias} = 0, \qquad \operatorname{Var} = \dots, \qquad \operatorname{MSE} = \dots` or `\gamma_{11} = \dots, \qquad \gamma_{12} = \dots`). Stack all multi-variable definitions and evaluations vertically in an `aligned` block.
- **Annotated Terms & Underbraces:** When breaking down complex algebraic expansions, use `\underbrace{...}_{\text{meaning}}` on separate lines to explain the geometric role of every single term without causing horizontal bloat.
- **Step-by-Step Walkthroughs:** Never skip intermediate steps in derivations. Show the algebraic progression vertically so the reader never wonders "where did that come from?" and never needs to scroll horizontally.

### 5. Visual & Diagram Presentation Policy
- **Sequential Figure Numbering:** Every diagram caption must explicitly start with a bold sequential figure label (e.g. `<strong>Figure 1:</strong> ...`, `<strong>Figure 2:</strong> ...`).
- **No Accent Colors on Text:** Text in SVG diagrams and articles must never use accent colors (`var(--accent)` or `var(--box-label-bg)`). All readable text, labels, coordinates, and mathematical annotations must use standard text colors (`var(--text)` for primary text, `var(--muted)` for secondary/subtitles) to guarantee high contrast, legibility, and a clean reading aesthetic. Accent colors are reserved strictly for lines, vectors, and graphical highlights.
- **No Enclosing Card Frames or Canvas Boxes:** Never wrap visual diagrams, figures, or interactive widgets in cards, bounding boxes, grey frames, or distinct background panels. All diagrams must blend seamlessly with the reading page background.
- **No Canvas Elements for Diagrams (Prefer Seamless Interactive SVG):** Use clean vector SVG representations that sit directly on the page body. If interactive 3D rotation is required, manipulate the SVG elements directly via JavaScript projection updates on drag, avoiding HTML5 `<canvas>` elements and toolbar frames.
- **Strict Project Color Palette:** Always make sure the color palette matches with the project chosen colors (`var(--bg)`, `var(--surface)`, `var(--text)`, `var(--accent)`, `var(--box-label-bg)`, `var(--border)`, `var(--muted)`, `var(--dark)`, `var(--highlight)`) unless mentioned otherwise. Never introduce arbitrary unstyled hex colors (e.g., ad-hoc blues, reds, or greens) into diagrams, figures, or widgets. All visual elements—strokes, fills, shaded regions, vectors, and highlights—must draw strictly from the project's semantic CSS color variables to ensure harmonious visual cohesion across light and dark themes.
- **Themed Color Palette:** Diagrams must adapt dynamically to light/dark themes using CSS variables (`var(--text)`, `var(--accent)`, `var(--box-label-bg)`, `var(--border)`, `var(--muted)`, `var(--dark)`, `var(--surface)`).
- **Legible Typography & Vertical Progression:** Ensure text labels inside SVGs are large (16px to 24px) and never squeezed horizontally. If comparing "Input Space" and "Transformed Space", stack the progression vertically or allocate generous height and width so annotations and equations remain crystal clear.
- **No Text Collisions / Overlapping Labels:** Ensure generous spacing, dynamic label offsets, and clean typography so lines, points, planes, and annotations remain legible in all viewport configurations and themes.

### 6. Hyperlink Policy
- **Never create hyperlinks to lessons that are in the same chapter.**
- In-text hyperlinks are reserved strictly for cross-connecting concepts and articles belonging to **different chapters** (which feeds into the cross-chapter knowledge graph on the main page).

### 7. Synthesis & "Connecting the Dots"
- Conclude each article with a comparative summary table and a retrospective section ("Connecting the Dots") that shows how all concepts across linear algebra, probability, and geometry unite into a coherent whole.
