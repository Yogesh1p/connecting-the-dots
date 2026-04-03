/* ============================================================
   article_components.js
   Handles:
   - Floating minimap TOC
   - Persistent reading progress
   - Article header injection
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // --- STATE & CONFIGURATION ---
  const CONFIG = {
    navOffset: 96,
    tocTargetTop: 120, // Used to calculate the closest TOC item
    scrollHighlightDelay: 1200,
    progressKey: `article-progress:${window.location.pathname}`
  };

  let tocItems = [];

  // ============================================================
  // 1. TOC HELPERS & GENERATION
  // ============================================================

  const sanitizeText = (str) => str.replace(/#$/, "").trim();

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const getHeaders = () => {
    return Array.from(document.querySelectorAll(".article-body h2, .article-body h3, .article-body h4"));
  };

  const buildTocItems = () => {
    return getHeaders().map((el) => {
      const text = sanitizeText(el.innerText);
      const hLevel = parseInt(el.tagName[1], 10);

      // Ensure every header has an ID for navigation
      if (!el.id) el.id = slugify(text);

      return {
        text,
        hLevel,
        nesting: Math.max(0, hLevel - 2),
        element: el,
      };
    });
  };

  const generateTocHTML = (items) => {
    const miniTocHTML = items.map(() => `<div class="toc-item-mini toc-light"></div>`).join("");
    
    const listTocHTML = items.map((item, i) => `
      <button class="toc-item toc-ind-${item.nesting}" data-index="${i}" type="button">
        ${item.text}
      </button>
    `).join("");

    return `
      <div class="toc-mini">${miniTocHTML}</div>
      <div class="toc-list">${listTocHTML}</div>
    `;
  };

  const initializeToc = () => {
    tocItems = buildTocItems();
    if (!tocItems.length) return;

    // Remove existing TOC if present (prevents duplicates)
    document.querySelector(".toc-wrapper")?.remove();

    const container = document.createElement("div");
    container.className = "toc-wrapper";
    container.innerHTML = generateTocHTML(tocItems);
    document.body.appendChild(container);

    // Attach click listeners to TOC buttons
    container.querySelectorAll(".toc-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigateToTocItem(parseInt(btn.dataset.index, 10));
      });
    });
  };

  // ============================================================
  // 2. TOC NAVIGATION & HIGHLIGHTING
  // ============================================================

  const highlightHeaderElement = (el) => {
    el.classList.add("toc-highlight-target");
    setTimeout(() => el.classList.remove("toc-highlight-target"), CONFIG.scrollHighlightDelay);
  };

  const updateActiveTocUI = (activeIndex) => {
    document.querySelectorAll(".toc-item-mini").forEach((el, i) => {
      el.classList.toggle("toc-light", i !== activeIndex);
    });

    document.querySelectorAll(".toc-item").forEach((el, i) => {
      el.classList.toggle("toc-bold", i === activeIndex);
    });
  };

  const navigateToTocItem = (index) => {
    const item = tocItems[index];
    if (!item) return;

    const yPosition = item.element.getBoundingClientRect().top + window.scrollY - CONFIG.navOffset;

    window.scrollTo({ top: yPosition, behavior: "smooth" });
    history.replaceState(null, "", `#${item.element.id}`);
    
    highlightHeaderElement(item.element);

    // Allow smooth scroll to settle before updating UI and progress
    setTimeout(() => {
      updateActiveTocUI(index);
      saveReadingProgress(index);
    }, 200);
  };

  const handleScrollProgress = () => {
    if (!tocItems.length) return;

    // --- THE FIX ---
    // If the user is at the very top of the page (viewing the header), 
    // clear the saved progress and remove TOC highlights.
    if (window.scrollY < 250) { 
      updateActiveTocUI(-1); // -1 ensures no TOC items are bolded
      localStorage.removeItem(CONFIG.progressKey);
      return;
    }

    let closestIdx = 0;
    let minDistance = Infinity;

    tocItems.forEach((item, i) => {
      const rect = item.element.getBoundingClientRect();
      const distance = Math.abs(rect.top - CONFIG.tocTargetTop);

      // Check if header is within viewport and closest to our target top
      if (rect.top < window.innerHeight && distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    });

    updateActiveTocUI(closestIdx);
    saveReadingProgress(closestIdx);
  };

  // ============================================================
  // 3. READING PROGRESS STORAGE
  // ============================================================

  const saveReadingProgress = (index) => {
    const item = tocItems[index];
    if (!item) return;

    localStorage.setItem(CONFIG.progressKey, JSON.stringify({
      headingId: item.element.id,
      scrollY: window.scrollY,
      updatedAt: Date.now(),
    }));
  };

  const restoreReadingProgress = () => {
    const savedData = localStorage.getItem(CONFIG.progressKey);
    if (!savedData) return;

    try {
      const progress = JSON.parse(savedData);
      const heading = document.getElementById(progress.headingId);

      if (heading) {
        // Wait slightly for layout paints before jumping
        setTimeout(() => {
          const yPosition = heading.getBoundingClientRect().top + window.scrollY - CONFIG.navOffset;
          window.scrollTo({ top: yPosition, behavior: "instant" });

          const idx = tocItems.findIndex(item => item.element.id === progress.headingId);
          if (idx !== -1) updateActiveTocUI(idx);
        }, 100);
        return;
      }

      // Fallback to absolute scroll position if the header ID is missing
      if (typeof progress.scrollY === "number") {
        window.scrollTo({ top: progress.scrollY, behavior: "instant" });
      }
    } catch (err) {
      console.warn("Failed to restore reading progress", err);
    }
  };

  // ============================================================
  // 4. ARTICLE HEADER INJECTION
  // ============================================================

  const injectArticleHeader = () => {
    const headerContainer = document.getElementById("article-header");
    if (!headerContainer) return;

    // Extract meta data safely
    const title = document.querySelector("title")?.innerText || "Untitled Article";
    const subtitle = document.querySelector('meta[name="description"]')?.content || "";
    const author = document.querySelector('meta[name="author"]')?.content || "";
    const dateStr = document.querySelector('meta[name="date"]')?.content || "";
    
    // NEW: Extract parent and keywords
    const parent = document.querySelector('meta[name="parent"]')?.content || "";
    const keywordsStr = document.querySelector('meta[name="keywords"]')?.content || "";

    // Format Date
    let formattedDate = "";
    if (dateStr) {
      formattedDate = new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
      });
    }

    // Format Tags
    let tagsHtml = "";
    if (keywordsStr) {
      // Splits the keywords string by spaces or commas and wraps them in spans
      const tagsArray = keywordsStr.split(/[,\s]+/).filter(Boolean);
      tagsHtml = `
        <div class="article-header__tags">
          ${tagsArray.map(tag => `<span class="article-tag">${tag}</span>`).join("")}
        </div>
      `;
    }

    // Inject compiled HTML
    headerContainer.innerHTML = `
      <header class="article-header">
        ${parent ? `<div class="article-header__parent">${parent}</div>` : ''}
        
        <h1 class="article-header__title">${title}</h1>
        ${subtitle ? `<div class="article-header__subtitle">${subtitle}</div>` : ''}
        
        <div class="article-header__meta">
          ${author ? `<span class="article-header__author">${author}</span>` : ''}
          ${formattedDate ? `<time class="article-header__date">${formattedDate}</time>` : ''}
        </div>
        
        ${tagsHtml}
      </header>
    `;
  };
  // ============================================================
  // 5. INITIALIZATION & LISTENERS
  // ============================================================

  injectArticleHeader();
  initializeToc();
  restoreReadingProgress();

  // Run an initial TOC alignment check slightly after load
  setTimeout(() => handleScrollProgress(), 150);

  // Optimized scroll listener using requestAnimationFrame
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScrollProgress();
        ticking = false;
      });
      ticking = true;
    }
  });
});