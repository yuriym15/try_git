# Scroll Freeze for X

A Chrome extension that limits the number of tweets displayed on Twitter/X to 40 per page and disables infinite scroll.

## Features

- **Tweet Limit**: Displays only the first 40 tweets on any Twitter/X page
- **No Infinite Scroll**: Prevents automatic loading of additional tweets when scrolling
- **Visual Indicator**: Shows a notification when the tweet limit is reached
- **Lightweight**: Minimal performance impact

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked"
5. Select the folder containing this extension
6. The extension should now be active

## Usage

1. Install the extension following the steps above
2. Visit Twitter/X (twitter.com or x.com)
3. The extension will automatically:
   - Limit visible tweets to 40
   - Hide any tweets beyond the limit
   - Prevent infinite scroll from loading more tweets
   - Show a blue notification in the bottom-right corner when the limit is reached

## How It Works

The extension uses a content script that:
1. Intercepts IntersectionObserver, fetch(), and XMLHttpRequest from page load
2. Blocks any network requests that would load more tweets once 40 are displayed
3. Uses MutationObserver to immediately remove any tweets beyond the limit
4. Displays a live counter showing current tweets and blocked requests

## Customization

To change the tweet limit, edit `content.js` and modify the `TWEET_LIMIT` constant:

```javascript
const TWEET_LIMIT = 40; // Change this value to your preferred limit
```

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main functionality script
- `README.md` - This file

## Permissions

The extension requires:
- **Host permissions** for `twitter.com` and `x.com` to run on these sites
- No additional permissions required

## Privacy

This extension:
- Does NOT collect any data
- Does NOT send any information to external servers
- Runs entirely locally in your browser
- Only affects Twitter/X pages

## License

MIT License - Feel free to modify and distribute

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.
