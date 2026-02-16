# Project Screenshots

This directory contains screenshot images of the external project websites displayed on the projects page.

## Capturing Screenshots

To capture or update the project screenshots, run the following command from the project root:

```bash
node scripts/capture-screenshots.mjs
```

### Prerequisites

Before running the script, make sure you have Playwright installed:

```bash
npm install -D playwright
npx playwright install chromium
```

### What the Script Does

The screenshot script will automatically:
1. Launch a headless Chromium browser
2. Navigate to each external project URL
3. Capture a high-quality screenshot (1920x1080, JPEG format, 85% quality)
4. Save the screenshots to this directory

### Projects Captured

The script captures screenshots for the following projects:
- **Robotaxi Safety Tracker** → `robotaxi-safety-tracker.jpg`
- **Nested Scaling of City Mass** → `nested-scaling-city-mass.jpg`
- **3D Urban Flood Risk** → `3d-urban-flood-risk.jpg`

### Image Specifications

- **Resolution**: 1920x1080 (Full HD)
- **Format**: JPEG
- **Quality**: 85%
- **Aspect Ratio**: 16:9 (matches aspect-video class in the UI)

## Manual Screenshots

If you prefer to capture screenshots manually:
1. Visit each project URL in your browser
2. Set your viewport to 1920x1080
3. Take a screenshot
4. Save it to this directory with the corresponding filename
5. Optimize the image for web (recommended: convert to JPEG at 85% quality)

## Updating Screenshots

Screenshots should be updated whenever:
- A project's design or content changes significantly
- New projects are added to the list
- The existing screenshots become outdated

Simply run the capture script again to refresh all screenshots.
