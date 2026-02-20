# Project Screenshot Capture

This repository includes an automated script to capture website snapshots of your external projects for display on the projects page.

## Quick Start

### 1. Install Playwright (One-time setup)

```bash
npm install -D playwright
npx playwright install chromium
```

### 2. Capture Screenshots

```bash
npm run screenshots
```

This will automatically capture screenshots for all external projects and save them to `public/projects/`.

## How It Works

The screenshot script (`scripts/capture-screenshots.mjs`) will:

1. Launch a headless Chromium browser
2. Navigate to each external project URL:
   - Robotaxi Safety Tracker
   - Nested Scaling of City Mass
   - 3D Urban Flood Risk
3. Wait for the page to fully load (including animations and lazy-loaded content)
4. Capture a high-quality screenshot (1920×1080, JPEG, 85% quality)
5. Save to `public/projects/[project-name].jpg`

## Screenshot Specifications

- **Resolution**: 1920×1080 (Full HD, 16:9 aspect ratio)
- **Format**: JPEG
- **Quality**: 85%
- **Viewport**: Matches standard desktop display

## Customization

To modify screenshot settings, edit `scripts/capture-screenshots.mjs`:

```javascript
const projects = [
  {
    name: 'project-name',
    url: 'https://example.com',
    viewport: { width: 1920, height: 1080 }, // Customize resolution
  },
];
```

You can also adjust:
- Image quality (change `quality: 85` to any value 0-100)
- Image format (change `type: 'jpeg'` to `'png'` for lossless)
- Wait time (change `waitForTimeout(2000)` for faster/slower loading sites)
- Full page capture (change `fullPage: false` to `true` to capture entire page)

## Manual Screenshots

If you prefer to capture screenshots manually:

1. Visit the project URL in your browser
2. Set viewport to 1920×1080 (or use browser dev tools)
3. Take a screenshot
4. Save as JPEG to `public/projects/[project-name].jpg`
5. Optimize for web (recommended: 85% quality)

## When to Update Screenshots

Update screenshots when:
- A project's design changes significantly
- New features are added to a project
- Adding new projects to the projects page
- Screenshots look outdated or don't reflect current state

## Troubleshooting

### Playwright installation fails

If browser download fails, try:
```bash
# Set custom download location
PLAYWRIGHT_BROWSERS_PATH=$HOME/.playwright npx playwright install chromium

# Or skip download and install manually later
PLAYWRIGHT_SKIP_DOWNLOAD=1 npm install -D playwright
```

### Screenshots look broken or incomplete

Increase the wait time in the script:
```javascript
await page.waitForTimeout(5000); // Wait 5 seconds instead of 2
```

### Need higher quality images

Change the quality setting:
```javascript
await page.screenshot({
  quality: 95, // Higher quality (larger file size)
  type: 'jpeg',
});
```

Or use PNG for lossless quality:
```javascript
await page.screenshot({
  type: 'png', // Lossless but larger files
});
```

## File Structure

```
├── scripts/
│   └── capture-screenshots.mjs    # Screenshot automation script
├── public/
│   └── projects/                  # Screenshot output directory
│       ├── README.md              # Additional documentation
│       ├── robotaxi-safety-tracker.jpg
│       ├── nested-scaling-city-mass.jpg
│       └── 3d-urban-flood-risk.jpg
└── src/
    ├── lib/
    │   └── constants.ts           # Project definitions with imagePath
    └── app/
        └── projects/
            └── page.tsx           # Projects page with image display
```

## Technical Details

The projects page (`src/app/projects/page.tsx`) automatically displays screenshots when available:
- Uses Next.js `Image` component for optimized loading
- 16:9 aspect ratio matching screenshot dimensions
- Hover effect with subtle zoom animation
- Responsive design for mobile devices
- Gracefully handles missing images (won't break the page)

The project metadata includes `imagePath` in `src/lib/constants.ts`:
```typescript
{
  title: "Project Name",
  url: "https://example.com",
  imagePath: "/projects/project-name.jpg", // Points to public/projects/
  // ...
}
```
