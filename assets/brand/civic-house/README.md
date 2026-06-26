# Civic House Icon Production Package

This package was generated from the approved raster artwork supplied in chat.

## Contents

- `/source/approved-reference.png` — original approved source image.
- `/brand/logo-mark-transparent-*.png` — transparent icon exports.
- `/brand/logo-mark-bg-*.png` — square icon exports with the approved background.
- `/favicon/favicon.ico` and PNG favicon sizes.
- `/apple/apple-touch-icon.png`
- `/android/android-chrome-192x192.png` and `android-chrome-512x512.png`
- `/social/og-image-1200x630.png`, `/social/twitter-card-1200x600.png`, and `/social/social-avatar-512.png`
- `/web/site.webmanifest`, `/web/meta-tags.html`, `/web/favicon.svg`
- `/brand-guide/color-palette.txt`

## Production note

The supplied logo was a PNG, not editable vector artwork. The SVG files in this package embed the approved raster image so browsers can use an SVG container, but they are not hand-drawn vector geometry. For a true master SVG, the mark should be redrawn from the approved raster reference.

## Recommended use

Use:
- `favicon.ico` for browser fallback.
- `favicon.svg` where supported.
- `apple-touch-icon.png` for iOS.
- `android-chrome-192x192.png` and `android-chrome-512x512.png` for PWA/app icons.
- `logo-mark-transparent-512.png` when placing the mark on custom backgrounds.
