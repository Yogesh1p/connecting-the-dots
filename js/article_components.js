/* ============================================================
   article_components.js
   Handles:
   - Floating minimap TOC
   - Article header injection
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  let tocItems = [];

  function getAllHeaders() {
    return Array.from(
      document.querySelectorAll(
        ".article-body h2, .article-body h3, .article-body h4"
      )
    );
  }

  function sanitizeText(str) {
    return str.replace(/#$/, "").trim();
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function buildTocItems() {
    const headers = getAllHeaders();
    const items = [];

    headers.forEach((el) => {
      const text = sanitizeText(el.innerText);
      const hLevel = parseInt(el.tagName[1], 10);

      if (!el.id) {
        el.id = slugify(text);
      }

      items.push({
        text,
        hLevel,
        nesting: Math.max(0, hLevel - 2),
        element: el,
      });
    });

    return items;
  }

  function genTocMini(items) {
    return `
      <div class="toc-mini">
        ${items
          .map(() => `<div class="toc-item-mini toc-light"></div>`)
          .join("")}
      </div>
    `;
  }

  function genTocList(items) {
    return `
      <div class="toc-list">
        ${items
          .map(
            (item, i) => `
              <button
                class="toc-item toc-ind-${item.nesting}"
                data-index="${i}"
                type="button"
              >
                ${item.text}
              </button>
            `
          )
          .join("")}
      </div>
    `;
  }

  function highlightElement(el) {
    el.classList.add("toc-highlight-target");
    setTimeout(() => {
      el.classList.remove("toc-highlight-target");
    }, 1200);
  }

  function showSelectedTocItem(index) {
    document.querySelectorAll(".toc-item-mini").forEach((el, i) => {
      el.classList.toggle("toc-light", i !== index);
    });

    document.querySelectorAll(".toc-item").forEach((el, i) => {
      el.classList.toggle("toc-bold", i === index);
    });
  }

  function tocGoTo(index) {
  const item = tocItems[index];
  if (!item) return;

  const navOffset = 96; // sticky nav + breathing room
  const y =
    item.element.getBoundingClientRect().top +
    window.scrollY -
    navOffset;

  window.scrollTo({
    top: y,
    behavior: "smooth",
  });

  history.replaceState(null, "", `#${item.element.id}`);
  highlightElement(item.element);

  setTimeout(() => {
    showSelectedTocItem(index);
  }, 200);
}

  function updateClosestToc() {
    if (!tocItems.length) return;

    let closestIdx = 0;
    let minDistance = Infinity;

    tocItems.forEach((item, i) => {
      const rect = item.element.getBoundingClientRect();
      const distance = Math.abs(rect.top - 120);

      if (rect.top < window.innerHeight && distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    });

    showSelectedTocItem(closestIdx);
  }

  function genToc() {
    tocItems = buildTocItems();
    if (!tocItems.length) return;

    const oldToc = document.querySelector(".toc-wrapper");
    if (oldToc) oldToc.remove();

    const container = document.createElement("div");
    container.className = "toc-wrapper";
    container.innerHTML = genTocMini(tocItems) + genTocList(tocItems);

    document.body.appendChild(container);

    container.querySelectorAll(".toc-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        tocGoTo(parseInt(btn.dataset.index, 10));
      });
    });
  }

  genToc();
  updateClosestToc();

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateClosestToc();
        ticking = false;
      });
      ticking = true;
    }
  });

  /* ============================================================
     HEADER INJECTION
     ============================================================ */

  window.injectArticleHeader = function (containerId, opts = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const {
      title = "",
      subtitle = "",
      date = "",
      readTime = "",
      tags = [],
    } = opts;

    const metaParts = [date, readTime].filter(Boolean);

    el.innerHTML = `
      <header class="article-header">
        <h1 class="article-header__title">${title}</h1>
        ${
          subtitle
            ? `<p class="article-header__subtitle">${subtitle}</p>`
            : ""
        }
        ${
          metaParts.length
            ? `<p class="article-header__meta">${metaParts.join(" · ")}</p>`
            : ""
        }
        ${
          tags.length
            ? `<div class="article-header__tags">
                ${tags
                  .map((tag) => `<span class="article-tag">${tag}</span>`)
                  .join("")}
              </div>`
            : ""
        }
      </header>
    `;
  };
});