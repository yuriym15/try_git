// Tweet Limiter - Limits tweets to 40 per page and disables infinite scroll
(function() {
  'use strict';

  const TWEET_LIMIT = 40;
  let tweetCount = 0;
  let limitReached = false;

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
    indicator.textContent = `Tweet limit reached (${TWEET_LIMIT} tweets shown)`;
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
  }

  // Disable infinite scroll by preventing scroll events from loading more content
  function disableInfiniteScroll() {
    // Prevent the page from detecting scroll near bottom
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', function(e) {
      const scrolledToBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 1000;

      if (limitReached && scrolledToBottom) {
        // Prevent further scrolling down when limit is reached
        window.scrollTo(0, lastScrollY);
        e.preventDefault();
        e.stopPropagation();
      } else {
        lastScrollY = window.scrollY;
      }
    }, { passive: false, capture: true });

    // Block fetch requests that load more tweets
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      if (limitReached && args[0] && typeof args[0] === 'string') {
        // Block Twitter's timeline fetch requests when limit is reached
        if (args[0].includes('/Timeline') || args[0].includes('/UserTweets')) {
          console.log('Tweet Limiter: Blocked request to load more tweets');
          return Promise.reject(new Error('Tweet limit reached'));
        }
      }
      return originalFetch.apply(this, args);
    };
  }

  // Set up MutationObserver to watch for new tweets being added
  function observeTweets() {
    const observer = new MutationObserver(function(mutations) {
      limitTweets();
    });

    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial check
    limitTweets();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      observeTweets();
      disableInfiniteScroll();
    });
  } else {
    observeTweets();
    disableInfiniteScroll();
  }

  // Also check periodically in case mutations are missed
  setInterval(limitTweets, 1000);

  console.log('Tweet Limiter extension loaded - limiting to', TWEET_LIMIT, 'tweets per page');
})();
