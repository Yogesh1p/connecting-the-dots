/* ============================================================
   article_components.js (Optimized & Robust)
   Handles: Article Shell, Header Injection, Prev/Next, and Progress Recovery
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
  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

  const getArticleRoot = () => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const libraryIndex = parts.findIndex(part => part.toLowerCase() === "library");
    if (libraryIndex === -1) return "";
    return "../".repeat(Math.max(1, parts.length - libraryIndex - 1));
  };

  const rootPath = getArticleRoot();

  const loadScriptOnce = (src, test) => new Promise((resolve, reject) => {
    if (test?.()) {
      resolve();
      return;
    }

    const existing = Array.from(document.scripts).find(script => script.src.endsWith(src));
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // ============================================================
  // 0. ARTICLE SHELL NORMALIZATION
  // ============================================================
  const ensureArticleShell = () => {
    let articleBody = document.querySelector(".article-body");

    if (!articleBody) {
      const semanticArticle = document.querySelector("article[data-article], article");
      if (semanticArticle) {
        articleBody = document.createElement("section");
        articleBody.className = "article-body";
        while (semanticArticle.firstChild) articleBody.appendChild(semanticArticle.firstChild);
        semanticArticle.replaceWith(articleBody);
      }
    }

    if (!articleBody) return null;

    const directArticleBody = articleBody;
    if (!document.getElementById("global-nav") && !document.querySelector(".nav-sticky, .nav-static")) {
      const nav = document.createElement("div");
      nav.id = "global-nav";
      nav.dataset.root = rootPath;
      document.body.prepend(nav);
      if (typeof window.initGlobalNavigation === "function") {
        window.initGlobalNavigation();
        const navEl = document.querySelector("nav");
        const topHam = document.getElementById("topHamBtn");
        const topDrawer = document.getElementById("topDrawer");

        if (navEl) {
          let lastScrollY = window.scrollY;
          navEl.style.transition = "transform 0.3s ease-in-out";
          window.addEventListener("scroll", () => {
            const currentScrollY = window.scrollY;
            navEl.style.transform = currentScrollY > lastScrollY && currentScrollY > 60
              ? "translateY(-100%)"
              : "translateY(0)";
            lastScrollY = currentScrollY;
          }, { passive: true });
        }

        if (topHam && topDrawer) {
          const toggleDrawer = (forceState) => {
            const isOpen = typeof forceState === "boolean" ? forceState : !topHam.classList.contains("is-open");
            topHam.classList.toggle("is-open", isOpen);
            topDrawer.classList.toggle("is-open", isOpen);
          };

          topHam.addEventListener("click", () => toggleDrawer());
          topHam.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleDrawer();
            }
          });
          document.addEventListener("click", (event) => {
            if (topDrawer.classList.contains("is-open") && !topHam.contains(event.target) && !topDrawer.contains(event.target)) {
              toggleDrawer(false);
            }
            if (event.target.closest("#topDrawer a")) toggleDrawer(false);
          });
          document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") toggleDrawer(false);
          });
        }
      }
    }

    if (document.querySelector(".page-wrap .reading-content .article-body")) {
      if (!document.getElementById("article-header")) {
        const header = document.createElement("div");
        header.id = "article-header";
        directArticleBody.parentNode.insertBefore(header, directArticleBody);
      }
      return directArticleBody;
    }

    const main = document.createElement("main");
    main.className = "page-wrap";

    const layout = document.createElement("div");
    layout.className = "article-layout";

    const readingContainer = document.createElement("div");
    readingContainer.className = "reading-container";

    const readingContent = document.createElement("article");
    readingContent.className = "reading-content";

    const header = document.createElement("div");
    header.id = "article-header";

    directArticleBody.replaceWith(main);
    main.appendChild(layout);
    layout.appendChild(readingContainer);
    readingContainer.appendChild(readingContent);
    readingContent.appendChild(header);
    readingContent.appendChild(directArticleBody);

    return directArticleBody;
  };

  const ensureArticleFooter = () => {
    let comments = document.getElementById("article-comments");
    if (!comments) {
      comments = document.createElement("div");
      comments.id = "article-comments";
    }

    let nav = document.getElementById("article-pagination");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "article-pagination";
      nav.className = "article-pagination";
      nav.setAttribute("aria-label", "Article navigation");
    }

    const pageWrap = document.querySelector(".page-wrap") || document.body;
    if (!nav.isConnected) {
      if (comments.isConnected && comments.parentNode) {
        comments.parentNode.insertBefore(nav, comments);
      } else {
        pageWrap.appendChild(nav);
      }
    }
    if (!comments.isConnected) pageWrap.appendChild(comments);

    if (typeof window.injectGiscusComments === "function") {
      window.injectGiscusComments("article-comments");
    }
  };

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

  const getCurrentArticleKey = () => {
    const path = decodeURIComponent(window.location.pathname).replace(/\\/g, "/");
    const libraryIndex = path.toLowerCase().indexOf("/library/");
    if (libraryIndex === -1) return "";
    return path.slice(libraryIndex + 1).replace(/^\/+/, "").toLowerCase();
  };

  const orderedPages = (pages) => [...pages].sort((a, b) => (
    (a.bookOrder ?? 999) - (b.bookOrder ?? 999) ||
    (a.chapterOrder ?? 999) - (b.chapterOrder ?? 999) ||
    (a.lessonorder ?? 999) - (b.lessonorder ?? 999) ||
    String(a.title || "").localeCompare(String(b.title || ""))
  ));

  const renderArticlePagination = async () => {
    const container = document.getElementById("article-pagination");
    if (!container) return;

    try {
      await loadScriptOnce(`${rootPath}builder/lib-data.js`, () => Array.isArray(window.rawPages));
    } catch (err) {
      container.remove();
      return;
    }

    const pages = orderedPages((window.rawPages || []).filter(page => page.status !== "hide"));
    const currentKey = getCurrentArticleKey();
    const currentIndex = pages.findIndex(page => String(page.sourcePath || "").toLowerCase() === currentKey);

    if (currentIndex === -1) {
      container.remove();
      return;
    }

    const makeLink = (page, direction) => {
      if (!page) return `<span class="article-pagination__link article-pagination__link--empty" aria-hidden="true"></span>`;
      const label = direction === "prev" ? "Previously" : "Up next";
      const arrow = direction === "prev" ? "←" : "→";
      const href = `${rootPath}${page.sourcePath}`;
      return `
        <a class="article-pagination__link article-pagination__link--${direction}" href="${href}">
          <span class="article-pagination__label">${label}</span>
          <span class="article-pagination__body">
            <span class="article-pagination__arrow" aria-hidden="true">${arrow}</span>
            <span class="article-pagination__title">${escapeHtml(page.title)}</span>
          </span>
        </a>
      `;
    };

    const prev = pages[currentIndex - 1];
    const next = pages[currentIndex + 1];

    if (!prev && !next) {
      container.remove();
      return;
    }

    container.classList.toggle("article-pagination--has-prev", Boolean(prev));
    container.classList.toggle("article-pagination--has-next", Boolean(next));
    container.innerHTML = `${makeLink(prev, "prev")}${makeLink(next, "next")}`;
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
    const headers = Array.from(document.querySelectorAll(".article-body h2, .article-body h3"));
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
  ensureArticleShell();
  injectArticleHeader();
  initializeToc();
  ensureArticleFooter();
  renderArticlePagination();
  
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
