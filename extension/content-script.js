(function () {
  const TOGGLE_CLASS = "hncc-toggle";
  const PROCESSED_ATTR = "data-hncc-processed";
  const BODY_CLASS = "hncc-body";

  const pageKey = `${location.origin}${location.pathname}`;
  let pageState = {};

  const siteConfig = getSiteConfig();

  injectStyles();

  fetchPageState().then(() => {
    processComments();
    observeComments();
  });

  function getSiteConfig() {
    const host = location.hostname;

    if (host === "news.ycombinator.com") {
      return {
        name: "Hacker News",
        commentSelector: ".comtr",
        bodySelector: ".commtext",
      };
    }

    if (host.endsWith("reddit.com")) {
      return {
        name: "Reddit",
        commentSelector: "[data-testid='comment']",
        bodySelector: "[id*='comment-rtjson-content'], div[data-adclicklocation='title'] ~ div",
      };
    }

    if (host === "github.com") {
      return {
        name: "GitHub",
        commentSelector: ".timeline-comment, .js-timeline-item",
        bodySelector: ".comment-body, .js-comment-body",
      };
    }

    return {
      name: host,
      commentSelector: "[id*='comment'], .comment, article[data-comment-id], .forum-post, .post",
      bodySelector: ".comment-body, .body, .content, .message, p",
    };
  }

  function injectStyles() {
    if (document.getElementById("hncc-style")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "hncc-style";
    style.textContent = `
      .${TOGGLE_CLASS} {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(148, 163, 184, 0.5);
        border-radius: 6px;
        background: rgba(15, 23, 42, 0.75);
        color: #e2e8f0;
        font-size: 11px;
        line-height: 1;
        padding: 4px 7px;
        margin-bottom: 6px;
        cursor: pointer;
        z-index: 2;
      }

      .${TOGGLE_CLASS}:hover {
        background: rgba(14, 165, 233, 0.25);
      }

      .hncc-collapsed .${BODY_CLASS} {
        display: none !important;
      }
    `;

    document.documentElement.appendChild(style);
  }

  function fetchPageState() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: "HNCC_GET_PAGE_STATE", pageKey }, (response) => {
          pageState = response?.state || {};
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }

  function processComments() {
    const candidates = Array.from(document.querySelectorAll(siteConfig.commentSelector));

    if (candidates.length === 0) {
      return;
    }

    for (const [index, candidate] of candidates.entries()) {
      if (!(candidate instanceof HTMLElement)) {
        continue;
      }

      if (candidate.getAttribute(PROCESSED_ATTR) === "true") {
        continue;
      }

      const body = resolveBodyElement(candidate);
      if (!body) {
        continue;
      }

      body.classList.add(BODY_CLASS);

      const commentId = getCommentIdentifier(candidate, index);
      const commentKey = `${pageKey}::${commentId}`;
      const toggle = createToggle(commentKey, candidate, body);

      candidate.prepend(toggle);
      candidate.setAttribute(PROCESSED_ATTR, "true");

      const existing = pageState[commentKey];
      applyCollapsedState(candidate, toggle, Boolean(existing?.collapsed));
    }
  }

  function resolveBodyElement(commentElement) {
    if (siteConfig.bodySelector) {
      const match = commentElement.querySelector(siteConfig.bodySelector);
      if (match instanceof HTMLElement) {
        return match;
      }
    }

    const fallback = commentElement.querySelector("p, .text, .content, div");
    return fallback instanceof HTMLElement ? fallback : null;
  }

  function getCommentIdentifier(commentElement, index) {
    const idCandidates = [
      commentElement.id,
      commentElement.getAttribute("data-comment-id"),
      commentElement.getAttribute("data-fullname"),
      commentElement.getAttribute("data-testid"),
    ].filter(Boolean);

    if (idCandidates.length > 0) {
      return idCandidates[0];
    }

    const textSample = commentElement.textContent?.trim().slice(0, 240) || `idx-${index}`;
    return `hash-${hashText(textSample)}-${index}`;
  }

  function hashText(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }

    return Math.abs(hash).toString(36);
  }

  function createToggle(commentKey, commentElement, bodyElement) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = TOGGLE_CLASS;
    button.textContent = "Collapse";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const nextCollapsed = !commentElement.classList.contains("hncc-collapsed");
      applyCollapsedState(commentElement, button, nextCollapsed);

      const record = {
        commentKey,
        pageKey,
        collapsed: nextCollapsed,
        updatedAt: Date.now(),
        url: location.href,
        title: document.title,
        site: siteConfig.name,
      };

      pageState[commentKey] = record;

      try {
        chrome.runtime.sendMessage(
          {
            type: "HNCC_SET_COMMENT_STATE",
            pageKey,
            record,
          },
          () => {
            // fire-and-forget
          },
        );
      } catch {
        // Ignore if extension context is unavailable.
      }
    });

    return button;
  }

  function applyCollapsedState(commentElement, button, collapsed) {
    if (collapsed) {
      commentElement.classList.add("hncc-collapsed");
      button.textContent = "Expand";
      return;
    }

    commentElement.classList.remove("hncc-collapsed");
    button.textContent = "Collapse";
  }

  function observeComments() {
    let timer = null;

    const observer = new MutationObserver(() => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        processComments();
      }, 250);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();
