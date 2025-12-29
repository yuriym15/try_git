// Tweet Limiter - Limits tweets to 40 per page and disables infinite scroll
(function() {
  'use strict';

  const TWEET_LIMIT = 40;
  let tweetCount = 0;
  let requestBlockCount = 0;

  console.log('Tweet Limiter: Initializing - will limit to', TWEET_LIMIT, 'tweets');

  // Create a visual indicator
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
    updateIndicator();
    return indicator;
  }

  function updateIndicator() {
    const indicator = document.getElementById('tweet-limit-indicator');
    if (indicator) {
      indicator.innerHTML = `Tweet limit: ${Math.min(tweetCount, TWEET_LIMIT)}/${TWEET_LIMIT}<br><small>Blocked: ${requestBlockCount}</small>`;
    }
  }

  // Function to count and limit tweets
  function limitTweets() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    tweetCount = tweets.length;

    // Remove tweets beyond the limit
    tweets.forEach((tweet, index) => {
      if (index >= TWEET_LIMIT) {
        tweet.remove(); // Completely remove instead of hiding
      }
    });

    // Update or create indicator
    let indicator = document.getElementById('tweet-limit-indicator');
    if (!indicator && tweets.length > 0) {
      indicator = createLimitIndicator();
      document.body.appendChild(indicator);
    } else if (indicator) {
      updateIndicator();
    }

    // Remove loading spinners
    const spinners = document.querySelectorAll('[role="progressbar"], [aria-label="Loading"]');
    spinners.forEach(spinner => {
      const parent = spinner.closest('div[data-testid="cellInnerDiv"]');
      if (parent) parent.remove();
    });
  }

  // IMMEDIATELY block IntersectionObserver from the start
  const OriginalIntersectionObserver = window.IntersectionObserver;
  let observerCount = 0;

  window.IntersectionObserver = function(callback, options) {
    observerCount++;
    const observerId = observerCount;

    console.log('Tweet Limiter: IntersectionObserver created #', observerId);

    // Intercept the callback to check tweet count
    const wrappedCallback = function(entries, observer) {
      const currentTweetCount = document.querySelectorAll('article[data-testid="tweet"]').length;

      // If we already have enough tweets, don't trigger the callback
      if (currentTweetCount >= TWEET_LIMIT) {
        console.log('Tweet Limiter: Blocked IntersectionObserver #', observerId, '- already have', currentTweetCount, 'tweets');
        return; // Don't call the original callback
      }

      return callback(entries, observer);
    };

    return new OriginalIntersectionObserver(wrappedCallback, options);
  };

  window.IntersectionObserver.prototype = OriginalIntersectionObserver.prototype;

  // IMMEDIATELY block fetch requests from the start
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const currentTweetCount = document.querySelectorAll('article[data-testid="tweet"]').length;

    // Block timeline requests if we already have enough tweets
    if (currentTweetCount >= TWEET_LIMIT) {
      if (url.includes('graphql') ||
          url.includes('/Timeline') ||
          url.includes('/UserTweets') ||
          url.includes('/HomeTimeline') ||
          url.includes('/HomeLatestTimeline') ||
          url.includes('adaptive.json')) {
        requestBlockCount++;
        console.log('Tweet Limiter: BLOCKED fetch -', url.substring(0, 100));
        updateIndicator();
        return Promise.reject(new Error('Tweet limit reached'));
      }
    }

    return originalFetch.apply(this, args);
  };

  // IMMEDIATELY block XMLHttpRequest from the start
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    const currentTweetCount = document.querySelectorAll('article[data-testid="tweet"]').length;

    if (currentTweetCount >= TWEET_LIMIT && typeof url === 'string') {
      if (url.includes('graphql') ||
          url.includes('/Timeline') ||
          url.includes('/UserTweets') ||
          url.includes('/HomeTimeline')) {
        requestBlockCount++;
        console.log('Tweet Limiter: BLOCKED XHR -', url.substring(0, 100));
        updateIndicator();
        throw new Error('Tweet limit reached');
      }
    }

    return originalOpen.apply(this, arguments);
  };

  // Aggressively watch for and remove tweets over the limit
  const observer = new OriginalIntersectionObserver(function(mutations) {
    limitTweets();
  });

  // Watch for any DOM changes
  const mutationObserver = new MutationObserver(function(mutations) {
    limitTweets();

    // Immediately remove any tweet elements being added over the limit
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    if (tweets.length > TWEET_LIMIT) {
      for (let i = TWEET_LIMIT; i < tweets.length; i++) {
        tweets[i].remove();
        console.log('Tweet Limiter: Removed tweet #', i + 1);
      }
    }
  });

  // Start observing as soon as possible
  function startObserving() {
    if (document.body) {
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      console.log('Tweet Limiter: Started observing DOM');
      limitTweets();
    } else {
      setTimeout(startObserving, 100);
    }
  }

  startObserving();

  // Check very frequently
  setInterval(limitTweets, 250);

  console.log('Tweet Limiter: Fully initialized');
})();
