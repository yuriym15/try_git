## X Paginator - Stop Infinite Scroll (Chrome MV3 Extension)

Paginate tweets on `x.com` and prevent infinite scroll. Adds a small floating UI with Prev/Next, page size, and a Load More button that fetches more tweets on demand.

### Install (Developer Mode)

1. Build not required. This is a plain MV3 extension.
2. Open Chrome → `chrome://extensions`.
3. Enable Developer mode (top-right).
4. Click "Load unpacked" and select this folder (`/workspace`).
5. Navigate to `https://x.com` and use the floating controls.

### Features

- Prevents infinite scroll by clamping scroll near the bottom (toggleable)
- Paginates visible tweets into pages (default 30 per page)
- Prev/Next navigation with page indicator
- Load More fetches additional tweets by briefly disabling the block and auto-scrolling

### Notes

- This extension does not use network request blocking. Instead, it prevents reaching the bottom sentinel and only allows it during "Load More".
- Works best on the Home timeline. Other timelines using `<article role="article">` tweets will also paginate.

