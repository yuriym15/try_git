// Scroll Freeze for X - Limits tweets to 40 per page and disables infinite scroll
(function() {
  'use strict';

  const TWEET_LIMIT = 40;
  let indicatorShown = false;

  console.log('Scroll Freeze: Loaded - limiting to', TWEET_LIMIT, 'tweets');

  // Create visual indicator
  function showIndicator(currentCount) {
    let indicator = document.getElementById('scroll-freeze-indicator');

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'scroll-freeze-indicator';
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
      document.body.appendChild(indicator);
    }

    indicator.textContent = `Showing ${currentCount}/${TWEET_LIMIT} tweets`;
    indicatorShown = true;
  }

  // Main function to enforce tweet limit
  function enforceTweetLimit() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');

    if (tweets.length === 0) return;

    let removed = 0;

    // Remove all tweets after the limit
    tweets.forEach((tweet, index) => {
      if (index >= TWEET_LIMIT) {
        tweet.remove();
        removed++;
      }
    });

    // Show indicator when we have tweets
    const currentCount = Math.min(tweets.length, TWEET_LIMIT);
    if (currentCount > 0) {
      showIndicator(currentCount);
    }

    // If we removed tweets, also remove any loading spinners
    if (removed > 0 || tweets.length >= TWEET_LIMIT) {
      const spinners = document.querySelectorAll('[role="progressbar"]');
      spinners.forEach(spinner => spinner.remove());

      console.log('Scroll Freeze: Removed', removed, 'excess tweets');
    }
  }

  // Watch for new tweets being added to the page
  const observer = new MutationObserver(function(mutations) {
    enforceTweetLimit();
  });

  // Start observing
  function startMonitoring() {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      console.log('Scroll Freeze: Monitoring started');
      enforceTweetLimit();
    } else {
      setTimeout(startMonitoring, 100);
    }
  }

  startMonitoring();

  // Check frequently to catch any tweets that slip through
  setInterval(enforceTweetLimit, 500);

  console.log('Scroll Freeze: Initialized');
})();
