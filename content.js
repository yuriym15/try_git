"use strict";

(() => {
  const LOG_PREFIX = "[X Paginator]";

  /**
   * Utility: log with prefix
   */
  function log(...args) {
    try {
      console.log(LOG_PREFIX, ...args);
    } catch (_) {}
  }

  /**
   * Utility: create element with props and children
   */
  function createElement(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (key === "className") {
        el.className = String(value);
      } else if (key === "style" && value && typeof value === "object") {
        Object.assign(el.style, value);
      } else if (key.startsWith("on") && typeof value === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        try { el.setAttribute(key, String(value)); } catch (_) {}
      }
    });
    for (const child of [].concat(children)) {
      if (child == null) continue;
      el.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  /**
   * Returns array of tweet <article> elements currently in DOM.
   */
  function queryAllTweetArticles() {
    return Array.from(document.querySelectorAll('article[role="article"]'));
  }

  function getMainScrollableElement() {
    // X/Twitter uses window scroll, but ensure we reference the scrolling element consistently.
    return document.scrollingElement || document.documentElement;
  }

  /**
   * Debounce helper
   */
  function debounce(fn, delay) {
    let timer = null;
    return function debounced(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  class Paginator {
    constructor(options) {
      this.pageSize = options.pageSize || 30;
      this.currentPageIndex = 0;
      this.tweetArticles = [];
      this.visibleOnly = false;
      this.onUpdate = options.onUpdate || (() => {});
      this.observer = null;
      this.refreshTweets = this.refreshTweets.bind(this);
    }

    setPageSize(newSize) {
      const parsed = Number(newSize);
      if (!Number.isFinite(parsed) || parsed < 1) return;
      this.pageSize = Math.max(1, Math.floor(parsed));
      this.currentPageIndex = 0;
      this.applyVisibility();
      this.onUpdate(this.getState());
    }

    getState() {
      return {
        pageSize: this.pageSize,
        currentPage: this.currentPageIndex + 1,
        totalPages: Math.max(1, Math.ceil(this.tweetArticles.length / this.pageSize)),
        totalTweets: this.tweetArticles.length
      };
    }

    start() {
      this.refreshTweets();
      // Observe document for added/removed tweets
      if (this.observer) this.observer.disconnect();
      this.observer = new MutationObserver(debounce(() => {
        this.refreshTweets();
      }, 250));
      this.observer.observe(document.body, { childList: true, subtree: true });
    }

    stop() {
      if (this.observer) this.observer.disconnect();
      this.observer = null;
    }

    refreshTweets() {
      const articles = queryAllTweetArticles();
      const prevCount = this.tweetArticles.length;
      this.tweetArticles = articles;
      if (articles.length !== prevCount) {
        // keep current page but clamp within range
        const maxPageIndex = Math.max(0, Math.ceil(articles.length / this.pageSize) - 1);
        if (this.currentPageIndex > maxPageIndex) this.currentPageIndex = maxPageIndex;
        this.applyVisibility();
        this.onUpdate(this.getState());
      }
    }

    applyVisibility() {
      const start = this.currentPageIndex * this.pageSize;
      const end = start + this.pageSize;
      const total = this.tweetArticles.length;
      for (let i = 0; i < total; i++) {
        const el = this.tweetArticles[i];
        const shouldShow = i >= start && i < end;
        if (!el) continue;
        el.style.display = shouldShow ? "" : "none";
      }
      // keep the top of current page near viewport top
      const firstVisible = this.tweetArticles[start];
      if (firstVisible && typeof firstVisible.scrollIntoView === "function") {
        try { firstVisible.scrollIntoView({ block: "start", behavior: "auto" }); } catch (_) {}
      }
    }

    goTo(index) {
      const maxIndex = Math.max(0, Math.ceil(this.tweetArticles.length / this.pageSize) - 1);
      const clamped = Math.max(0, Math.min(maxIndex, index));
      if (clamped === this.currentPageIndex) return;
      this.currentPageIndex = clamped;
      this.applyVisibility();
      this.onUpdate(this.getState());
    }

    next() { this.goTo(this.currentPageIndex + 1); }
    prev() { this.goTo(this.currentPageIndex - 1); }
  }

  class ScrollBlocker {
    constructor() {
      this.enabled = true;
      this.nearBottomThresholdPx = 600;
      this.lastScrollTop = 0;
      this.toastEl = null;
      this.scrollHandler = this.onScroll.bind(this);
    }

    setEnabled(isEnabled) {
      this.enabled = Boolean(isEnabled);
    }

    attach() {
      window.addEventListener("scroll", this.scrollHandler, { passive: false });
    }

    detach() {
      window.removeEventListener("scroll", this.scrollHandler);
    }

    showToast(message) {
      if (this.toastEl) {
        this.toastEl.textContent = message;
        return;
      }
      const el = createElement("div", { className: "x-paginator-toast" }, [message]);
      document.body.appendChild(el);
      this.toastEl = el;
      setTimeout(() => {
        if (this.toastEl) {
          this.toastEl.remove();
          this.toastEl = null;
        }
      }, 1500);
    }

    onScroll() {
      const scrollEl = getMainScrollableElement();
      const maxScrollTop = Math.max(0, scrollEl.scrollHeight - window.innerHeight);
      const distanceToBottom = maxScrollTop - scrollEl.scrollTop;
      if (this.enabled && distanceToBottom < this.nearBottomThresholdPx) {
        // prevent approaching the sentinel that triggers infinite loading
        const clampTo = Math.max(0, maxScrollTop - this.nearBottomThresholdPx);
        if (scrollEl.scrollTop > clampTo) {
          scrollEl.scrollTop = this.lastScrollTop || clampTo;
          this.showToast("Infinite scroll blocked. Use paginator controls.");
        }
      } else {
        this.lastScrollTop = scrollEl.scrollTop;
      }
    }
  }

  function createControlsUI(paginator, scrollBlocker) {
    const container = createElement("div", { className: "x-paginator-controls", id: "x-paginator-controls" });

    const prevBtn = createElement("button", { id: "x-pg-prev" }, ["Prev"]);
    const nextBtn = createElement("button", { id: "x-pg-next" }, ["Next"]);
    const pageIndicator = createElement("span", { className: "page-indicator", id: "x-pg-indicator" }, ["1 / 1"]);
    const loadMoreBtn = createElement("button", { id: "x-pg-load" }, ["Load More"]);
    const pageSizeInput = createElement("input", { id: "x-pg-size", type: "number", min: "1", step: "1", value: String(paginator.pageSize), title: "Items per page" });

    const toggleCheck = createElement("input", { id: "x-pg-block-toggle", type: "checkbox", checked: "" });
    const toggleLabel = createElement("label", { for: "x-pg-block-toggle" }, ["Block infinite scroll"]);
    const toggleWrap = createElement("div", { className: "toggle" }, [toggleCheck, toggleLabel]);

    const row1 = createElement("div", { className: "row" }, [prevBtn, pageIndicator, nextBtn]);
    const row2 = createElement("div", { className: "row" }, [loadMoreBtn, createElement("span", {}, ["per page: "]), pageSizeInput]);
    const row3 = createElement("div", { className: "row" }, [toggleWrap]);

    container.appendChild(row1);
    container.appendChild(row2);
    container.appendChild(row3);

    // Wire events
    prevBtn.addEventListener("click", () => paginator.prev());
    nextBtn.addEventListener("click", () => paginator.next());
    pageSizeInput.addEventListener("change", () => paginator.setPageSize(pageSizeInput.value));
    toggleCheck.addEventListener("change", () => {
      scrollBlocker.setEnabled(toggleCheck.checked);
    });

    loadMoreBtn.addEventListener("click", async () => {
      await triggerLoadMore({ paginator, scrollBlocker, pageIndicator });
    });

    paginator.onUpdate = (state) => {
      pageIndicator.textContent = `${state.currentPage} / ${state.totalPages}`;
    };

    return container;
  }

  async function triggerLoadMore({ paginator, scrollBlocker }) {
    const initialCount = paginator.tweetArticles.length;
    const scrollEl = getMainScrollableElement();
    const wasEnabled = scrollBlocker.enabled;
    scrollBlocker.setEnabled(false);
    log("Load more: temporarily disabled blocker");

    const deadline = Date.now() + 8000; // 8s timeout
    let success = false;
    while (Date.now() < deadline) {
      // scroll to bottom to try to trigger loading
      scrollEl.scrollTop = scrollEl.scrollHeight;
      await new Promise(r => setTimeout(r, 400));
      paginator.refreshTweets();
      if (paginator.tweetArticles.length > initialCount) {
        success = true;
        break;
      }
    }

    scrollBlocker.setEnabled(wasEnabled);
    log("Load more: re-enabled blocker");

    if (success) {
      const newCount = paginator.tweetArticles.length;
      const added = newCount - initialCount;
      const newLastPage = Math.max(0, Math.ceil(newCount / paginator.pageSize) - 1);
      paginator.goTo(newLastPage);
      log(`Loaded ${added} new tweets.`);
    } else {
      log("No new tweets loaded within timeout");
    }
  }

  function ensureSingleInjection() {
    if (document.getElementById("x-paginator-controls")) return true;
    return false;
  }

  function init() {
    if (ensureSingleInjection()) return;
    const paginator = new Paginator({ pageSize: 30, onUpdate: () => {} });
    const blocker = new ScrollBlocker();
    blocker.attach();
    const ui = createControlsUI(paginator, blocker);
    document.body.appendChild(ui);
    paginator.start();
    log("Initialized.");
  }

  // Run only on x.com
  if (location.hostname.endsWith("x.com")) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      init();
    } else {
      window.addEventListener("DOMContentLoaded", init, { once: true });
    }
  }
})();

