// Tweet Limiter - Limits tweets to 40 per page and disables infinite scroll
(function() {
  'use strict';

  const TWEET_LIMIT = 40;
  let tweetCount = 0;
  let limitReached = false;
  let requestBlockCount = 0;

  // Create a visual indicator when limit is reached
  function createLimitIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'tweet-limit-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1d9bf0;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
    `;
    indicator.innerHTML = `Tweet limit reached (${TWEET_LIMIT} tweets shown)<br><small>Requests blocked: ${requestBlockCount}</small>`;
    return indicator;
  }

  // Function to count and limit tweets
  function limitTweets() {
    // Twitter/X uses article elements with specific data attributes for tweets
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');

    tweets.forEach((tweet, index) => {
      if (index >= TWEET_LIMIT) {
        tweet.style.display = 'none';
        if (!limitReached) {
          limitReached = true;
          const indicator = createLimitIndicator();
          document.body.appendChild(indicator);
        }
      }
    });

    tweetCount = tweets.length;

    // Update the indicator with blocked request count
    const indicator = document.getElementById('tweet-limit-indicator');
    if (indicator && limitReached) {
      indicator.innerHTML = `Tweet limit reached (${TWEET_LIMIT} tweets shown)<br><small>Requests blocked: ${requestBlockCount}</small>`;
    }

    // Once we hit the limit, remove loading spinners
    if (limitReached) {
      removeLoadingIndicators();
    }
  }

  // Remove loading spinners and "Show more" buttons
  function removeLoadingIndicators() {
    // Remove loading spinners
    const spinners = document.querySelectorAll('[role="progressbar"], [aria-label="Loading"]');
    spinners.forEach(spinner => spinner.remove());

    // Remove "Show more tweets" type elements
    const showMoreButtons = document.querySelectorAll('div[data-testid="cellInnerDiv"]');
    showMoreButtons.forEach(btn => {
      if (btn.textContent.includes('Show') || btn.textContent.includes('Loading')) {
        btn.remove();
      }
    });
  }

  // Aggressively block all IntersectionObservers (used by Twitter for infinite scroll)
  function blockIntersectionObservers() {
    const OriginalIntersectionObserver = window.IntersectionObserver;

    window.IntersectionObserver = function(callback, options) {
      // Create the observer but intercept the callback
      const wrappedCallback = function(entries, observer) {
        if (limitReached) {
          // Don't call the original callback when limit is reached
          console.log('Tweet Limiter: Blocked IntersectionObserver callback');
          return;
        }
        return callback(entries, observer);
      };

      return new OriginalIntersectionObserver(wrappedCallback, options);
    };

    // Preserve the original constructor properties
    window.IntersectionObserver.prototype = OriginalIntersectionObserver.prototype;
  }

  // Disable infinite scroll by blocking network requests
  function disableInfiniteScroll() {
    // Block fetch requests more aggressively
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

      // Once limit is reached, block ALL timeline-related requests
      if (limitReached) {
        if (url.includes('/Timeline') ||
            url.includes('/UserTweets') ||
            url.includes('/HomeTimeline') ||
            url.includes('/HomeLatestTimeline') ||
            url.includes('adaptive.json') ||
            url.includes('TweetDetail')) {
          requestBlockCount++;
          console.log('Tweet Limiter: Blocked fetch request:', url);
          return Promise.reject(new Error('Tweet limit reached - request blocked'));
        }
      }

      return originalFetch.apply(this, args);
    };

    // Also intercept XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      if (limitReached && typeof url === 'string') {
        if (url.includes('/Timeline') ||
            url.includes('/UserTweets') ||
            url.includes('/HomeTimeline') ||
            url.includes('adaptive.json')) {
          requestBlockCount++;
          console.log('Tweet Limiter: Blocked XHR request:', url);
          throw new Error('Tweet limit reached - request blocked');
        }
      }
      return originalOpen.apply(this, arguments);
    };
  }

  // Set up MutationObserver to watch for new tweets being added
  function observeTweets() {
    const observer = new MutationObserver(function(mutations) {
      limitTweets();

      // If limit is reached, aggressively remove any new content
      if (limitReached) {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              // If it's a tweet and we're over the limit, remove it immediately
              if (node.matches && node.matches('article[data-testid="tweet"]')) {
                const allTweets = document.querySelectorAll('article[data-testid="tweet"]');
                const index = Array.from(allTweets).indexOf(node);
                if (index >= TWEET_LIMIT) {
                  node.remove();
                }
              }
              // Also remove loading indicators
              if (node.matches && (node.matches('[role="progressbar"]') || node.matches('[aria-label="Loading"]'))) {
                node.remove();
              }
            }
          });
        });
      }
    });

    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial check
    limitTweets();
  }

  // Initialize everything
  function init() {
    blockIntersectionObservers();
    disableInfiniteScroll();
    observeTweets();

    console.log('Tweet Limiter extension loaded - limiting to', TWEET_LIMIT, 'tweets per page');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also check periodically in case mutations are missed
  setInterval(limitTweets, 500);
})();
