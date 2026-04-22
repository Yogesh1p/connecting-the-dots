/* ============================================================
   article_components.js (Optimized & Robust)
   Handles: Header Injection, and Instant Progress Recovery
   ============================================================ */

// 1. SILENCE BROWSER SCROLL RESTORATION
// This prevents the browser from fighting our custom restoration logic
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

document.addEventListener("DOMContentLoaded", () => {
  const CONFIG = {
    navOffset: 96,
    tocTargetTop: 120,
    scrollHighlightDelay: 1200,
    progressKey: `article-progress:${window.location.pathname}`,
    saveDebounceMs: 150, 
  };

  let state = {
    tocItems: [],
    isScrollingProgrammatically: false,
    saveTimer: null,
  };

  const getMeta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || "";

  // ============================================================
  // 1. ARTICLE HEADER INJECTION
  // ============================================================
  const injectArticleHeader = () => {
    const container = document.getElementById("article-header");
    if (!container) return;

    const title = getMeta("title") || document.querySelector("title")?.textContent || "Untitled";
    const subtitle = getMeta("description");
    const author = getMeta("author");
    const dateStr = getMeta("last_updated") || getMeta("date");
    const parent = getMeta("parent") || getMeta("chapter");
    const keywords = getMeta("keywords");

    let formattedDate = "";
    if (dateStr && !isNaN(Date.parse(dateStr))) {
      formattedDate = new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
      });
      if (getMeta("last_updated")) formattedDate = `Updated ${formattedDate}`;
    }

    let readingTime = parseInt(getMeta("reading_time"), 10);
    if (!readingTime) {
      const text = document.querySelector(".article-body")?.innerText || "";
      readingTime = Math.max(1, Math.ceil(text.split(/\s+/).length / 220));
    }

    const tagsHtml = keywords ? keywords.split(',').map(tag => 
      `<span class="article-tag">${tag.trim()}</span>`).join("") : "";

    container.innerHTML = `
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
        ${tagsHtml ? `<div class="article-header__tags">${tagsHtml}</div>` : ''}
      </header>
    `;
  };

  // ============================================================
  // 2. PROGRESS SAVING (Instant + Debounced)
  // ============================================================
  const saveProgress = (immediate = false) => {
    if (immediate) {
      performSave();
    } else {
      clearTimeout(state.saveTimer);
      state.saveTimer = setTimeout(performSave, CONFIG.saveDebounceMs);
    }
  };

  const performSave = () => {
    const scrollY = window.scrollY;
    let headingId = "";

    // Identify current heading for context
    if (state.tocItems.length > 0) {
      let closestIdx = 0;
      let minDistance = Infinity;
      state.tocItems.forEach((item, i) => {
        const rect = item.element.getBoundingClientRect();
        const dist = Math.abs(rect.top - CONFIG.tocTargetTop);
        if (rect.top < window.innerHeight && dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });
      headingId = state.tocItems[closestIdx]?.element.id || "";
    }

    localStorage.setItem(CONFIG.progressKey, JSON.stringify({
      scrollY,
      headingId,
      updatedAt: Date.now()
    }));
  };

  // FORCE SAVE ON REFRESH/EXIT: Fixes the 5s lag
  window.addEventListener("beforeunload", () => saveProgress(true));

  // ============================================================
  // 3. TOC & NAVIGATION
  // ============================================================
  const initializeToc = () => {
    const headers = Array.from(document.querySelectorAll(".article-body h2, .article-body h3, .article-body h4"));
    const existingIds = new Set();

    state.tocItems = headers.map((el, index) => {
      let id = el.id || el.innerText.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      while (existingIds.has(id)) id += `-${index}`;
      el.id = id;
      existingIds.add(id);

      return { 
        index, 
        element: el, 
        nesting: Math.max(0, parseInt(el.tagName[1]) - 2) 
      };
    });

    if (!state.tocItems.length) return;

    const container = document.createElement("div");
    container.className = "toc-wrapper";
    container.innerHTML = `
      <div class="toc-mini">${state.tocItems.map(() => `<div class="toc-item-mini toc-light"></div>`).join("")}</div>
      <div class="toc-list">${state.tocItems.map(item => `
        <button class="toc-item toc-ind-${item.nesting}" data-index="${item.index}" type="button">
          ${item.element.innerText.replace(/#$/, "").trim()}
        </button>`).join("")}</div>
    `;
    
    document.body.appendChild(container);

    // --- NEW: Auto-scroll TOC to active item on hover ---
    container.addEventListener("mouseenter", () => {
      const activeItem = container.querySelector(".toc-item.toc-bold");
      if (activeItem) {
        activeItem.scrollIntoView({ 
          behavior: 'auto', 
          block: 'center' 
        });
      }
    });
    // ----------------------------------------------------

    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".toc-item");
      if (btn) navigateTo(parseInt(btn.dataset.index));
    });
  };

  const navigateTo = (index) => {
    const item = state.tocItems[index];
    if (!item) return;

    state.isScrollingProgrammatically = true;
    const yPos = item.element.getBoundingClientRect().top + window.scrollY - CONFIG.navOffset;

    window.scrollTo({ top: yPos, behavior: "smooth" });
    history.replaceState(null, "", `#${item.element.id}`);
    
    updateUI(index);
    saveProgress(true);

    setTimeout(() => { state.isScrollingProgrammatically = false; }, 1000);
  };

  const updateUI = (activeIndex) => {
    document.querySelectorAll(".toc-item-mini").forEach((el, i) => el.classList.toggle("toc-light", i !== activeIndex));
    document.querySelectorAll(".toc-item").forEach((el, i) => el.classList.toggle("toc-bold", i === activeIndex));
  };

  // ============================================================
  // 4. RESTORATION & EXECUTION
  // ============================================================
  const restoreProgress = () => {
    // 1. Priority: URL Hash
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.substring(1));
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - CONFIG.navOffset, behavior: "instant" });
        return;
      }
    }

    // 2. Fallback: LocalStorage
    const saved = localStorage.getItem(CONFIG.progressKey);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.scrollY) {
        window.scrollTo({ top: data.scrollY, behavior: "instant" });
      }
    }
  };

  // Launch sequence
  injectArticleHeader();
  initializeToc();
  
  // High-frequency scroll listener using requestAnimationFrame
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (!state.isScrollingProgrammatically) {
          saveProgress();
          // Logic for updating active TOC highlight...
          let closest = 0;
          state.tocItems.forEach((item, i) => {
            if (item.element.getBoundingClientRect().top < CONFIG.tocTargetTop + 50) closest = i;
          });
          updateUI(window.scrollY < 200 ? -1 : closest);
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Restore immediately—don't wait for images
  if (document.readyState === 'complete') {
    restoreProgress();
  } else {
    window.addEventListener('load', restoreProgress);
  }
});