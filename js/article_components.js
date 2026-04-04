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
    tocTargetTop: 120,
    scrollHighlightDelay: 1200,
    progressKey: `article-progress:${window.location.pathname}`,
    saveDebounceMs: 200, // How long to wait after scrolling stops to save progress
  };

  let tocItems = [];
  let isScrollingProgrammatically = false;
  let saveProgressTimer = null;

  // ============================================================
  // 1. HELPERS & METADATA
  // ============================================================

  const getMeta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || "";

  // Generates a URL-friendly slug and ensures it is unique
  const generateUniqueId = (text, existingIds) => {
    let baseSlug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, ""); // Trim dashes
    
    let slug = baseSlug || "section";
    let counter = 1;
    while (existingIds.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    existingIds.add(slug);
    return slug;
  };

  // ============================================================
  // 2. ARTICLE HEADER INJECTION
  // ============================================================

  const injectArticleHeader = () => {
    const headerContainer = document.getElementById("article-header");
    if (!headerContainer) return;

    const title = getMeta("title") || document.querySelector("title")?.textContent || "Untitled Article";
    const subtitle = getMeta("description");
    const author = getMeta("author");
    const dateStr = getMeta("date");
    const parent = getMeta("parent") || getMeta("chapter");
    const keywordsStr = getMeta("keywords");

    // Format Date safely
    let formattedDate = "";
    if (dateStr && !isNaN(Date.parse(dateStr))) {
      formattedDate = new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
      });
    }

    // Calculate Reading Time
    const articleBody = document.querySelector(".article-body");
    const text = articleBody ? articleBody.innerText.replace(/\s+/g, " ").trim() : "";
    const wordCount = text.split(" ").filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 220));

    // Format Tags
    const tagsArray = keywordsStr ? keywordsStr.split(/[,\s]+/).filter(Boolean) : [];
    const tagsHtml = tagsArray.length > 0 
      ? `<div class="article-header__tags">${tagsArray.map(tag => `<span class="article-tag">${tag}</span>`).join("")}</div>`
      : "";

    // Inject HTML
    headerContainer.innerHTML = `
      <header class="article-header">
        ${parent ? `<div class="article-header__parent">${parent}</div>` : ''}
        <h1 class="article-header__title">${title}</h1>
        ${subtitle ? `<div class="article-header__subtitle">${subtitle}</div>` : ''}
        
        <div class="article-header__meta">
          ${author ? `<span class="article-header__author">${author}</span>` : ''}
          ${formattedDate ? `<time class="article-header__date">${formattedDate}</time>` : ''}
          ${(author || formattedDate) ? `<span class="article-header__sep">•</span>` : ''}
          <span class="article-header__reading-time">${readingTime} min read</span>
        </div>
        ${tagsHtml}
      </header>
    `;
  };

  // ============================================================
  // 3. TOC GENERATION & INITIALIZATION
  // ============================================================

  const buildTocItems = () => {
    const headers = Array.from(document.querySelectorAll(".article-body h2, .article-body h3, .article-body h4"));
    const existingIds = new Set();

    return headers.map((el, index) => {
      const text = el.innerText.replace(/#$/, "").trim();
      const hLevel = parseInt(el.tagName[1], 10);

      if (!el.id) {
        el.id = generateUniqueId(text, existingIds);
      } else {
        existingIds.add(el.id); // Track manually added IDs to prevent collisions
      }

      return { index, text, hLevel, nesting: Math.max(0, hLevel - 2), element: el };
    });
  };

  const initializeToc = () => {
    tocItems = buildTocItems();
    if (!tocItems.length) return;

    document.querySelector(".toc-wrapper")?.remove(); // Prevent duplicates

    const container = document.createElement("div");
    container.className = "toc-wrapper";

    const miniTocHTML = tocItems.map(() => `<div class="toc-item-mini toc-light"></div>`).join("");
    const listTocHTML = tocItems.map((item) => `
      <button class="toc-item toc-ind-${item.nesting}" data-index="${item.index}" type="button">
        ${item.text}
      </button>
    `).join("");

    container.innerHTML = `
      <div class="toc-mini">${miniTocHTML}</div>
      <div class="toc-list">${listTocHTML}</div>
    `;
    document.body.appendChild(container);

    // Event Delegation for TOC clicks (better performance than individual listeners)
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".toc-item");
      if (btn) {
        navigateToTocItem(parseInt(btn.dataset.index, 10));
      }
    });
  };

  // ============================================================
  // 4. NAVIGATION & HIGHLIGHTING
  // ============================================================

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

    isScrollingProgrammatically = true; // Pause scroll listener during smooth scroll
    
    const yPosition = item.element.getBoundingClientRect().top + window.scrollY - CONFIG.navOffset;

    window.scrollTo({ top: yPosition, behavior: "smooth" });
    history.replaceState(null, "", `#${item.element.id}`);
    
    item.element.classList.add("toc-highlight-target");
    setTimeout(() => item.element.classList.remove("toc-highlight-target"), CONFIG.scrollHighlightDelay);

    updateActiveTocUI(index);
    debouncedSaveProgress(index, yPosition);

    // Re-enable scroll listener after animation finishes (~800ms)
    setTimeout(() => { isScrollingProgrammatically = false; }, 800);
  };

  const handleScrollProgress = () => {
    if (!tocItems.length || isScrollingProgrammatically) return;

    if (window.scrollY < 200) {
      updateActiveTocUI(-1);
      debouncedSaveProgress(-1, window.scrollY); // Save the fact they are at the top, but don't delete history completely
      return;
    }

    let closestIdx = 0;
    let minDistance = Infinity;

    tocItems.forEach((item, i) => {
      const rect = item.element.getBoundingClientRect();
      const distance = Math.abs(rect.top - CONFIG.tocTargetTop);

      if (rect.top < window.innerHeight && distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    });

    updateActiveTocUI(closestIdx);
    debouncedSaveProgress(closestIdx, window.scrollY);
  };

  // ============================================================
  // 5. READING PROGRESS STORAGE
  // ============================================================

  const debouncedSaveProgress = (index, scrollY) => {
    clearTimeout(saveProgressTimer);
    saveProgressTimer = setTimeout(() => {
      const payload = { scrollY, updatedAt: Date.now() };
      if (index >= 0 && tocItems[index]) {
        payload.headingId = tocItems[index].element.id;
      }
      localStorage.setItem(CONFIG.progressKey, JSON.stringify(payload));
    }, CONFIG.saveDebounceMs);
  };

  const restoreReadingProgress = () => {
    const savedData = localStorage.getItem(CONFIG.progressKey);
    if (!savedData) return;

    try {
      const progress = JSON.parse(savedData);
      
      if (typeof progress.scrollY === "number") {
        window.scrollTo({ top: progress.scrollY, behavior: "instant" });
        handleScrollProgress();
      } else if (progress.headingId) {
        const heading = document.getElementById(progress.headingId);
        if (heading) {
          const yPosition = heading.getBoundingClientRect().top + window.scrollY - CONFIG.navOffset;
          window.scrollTo({ top: yPosition, behavior: "instant" });
        }
      }
    } catch (err) {
      console.warn("Failed to restore reading progress", err);
    }
  };

  // ============================================================
  // 6. EXECUTION PIPELINE
  // ============================================================

  injectArticleHeader();
  initializeToc();

  // Optimized Scroll Listener
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScrollProgress();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // RESTORE ON LOAD (Not DOMContentLoaded)
  // Ensures images/fonts are loaded so the layout height is exact before restoring scroll
  window.addEventListener("load", restoreReadingProgress);
});