# Tweet Limiter Chrome Extension

A Chrome extension that limits the number of tweets displayed on Twitter/X to 40 per page and disables infinite scroll.

## Features

- **Tweet Limit**: Displays only the first 40 tweets on any Twitter/X page
- **No Infinite Scroll**: Prevents automatic loading of additional tweets when scrolling
- **Visual Indicator**: Shows a notification when the tweet limit is reached
- **Lightweight**: Minimal performance impact

## Installation

### Option 1: Install from Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked"
5. Select the folder containing this extension
6. The extension should now be active

### Option 2: Create Icon Files (Optional)

The manifest.json references icon files. You can create your own icons or use placeholders:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

If you don't have icons, the extension will still work but may show a default icon.

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
1. Monitors the page for tweet elements using a MutationObserver
2. Counts tweets and hides any beyond the 40-tweet limit
3. Intercepts scroll events and fetch requests to prevent loading additional tweets
4. Displays a visual indicator when the limit is reached

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
