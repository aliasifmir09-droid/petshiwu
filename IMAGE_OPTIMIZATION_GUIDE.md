# Image Optimization Guide

## Overview

This guide explains how to create optimized versions of images to improve page load performance and meet PageSpeed Insights recommendations.

## Current Issues

1. **logo.png** (81.5 KiB)
   - Current size: 251x253 pixels
   - Displayed at: 64px (mobile) / 80px (desktop)
   - Needs: WebP/AVIF versions and proper sizing

2. **category-vitamins-supplements.png** (17.5 KiB)
   - Needs: AVIF/WebP versions for better compression

## Required Optimized Images

### Logo Images

Create the following optimized versions in `frontend/public/`:

1. **logo.avif** - AVIF format (best compression)
   - Size: 80x80px (for desktop)
   - Size: 64x64px (for mobile) - or use responsive srcset
   - Quality: 80-85%

2. **logo.webp** - WebP format (fallback)
   - Size: 80x80px
   - Size: 64x64px (for mobile)
   - Quality: 85%

3. **logo.png** - Keep original but optimize
   - Compress existing PNG
   - Reduce to max 80x80px if possible

### Category Images

For `category-vitamins-supplements.png`, create:

1. **category-vitamins-supplements.avif**
2. **category-vitamins-supplements.webp**

## Tools for Image Optimization

### Online Tools

1. **Squoosh** (https://squoosh.app/)
   - Upload image
   - Select AVIF or WebP format
   - Adjust quality (80-85% recommended)
   - Download optimized version

2. **CloudConvert** (https://cloudconvert.com/)
   - Convert PNG to AVIF/WebP
   - Batch processing available

### Command Line Tools

#### Using Sharp (Node.js)

```bash
npm install -g sharp-cli

# Convert to AVIF
sharp -i logo.png -o logo.avif --avif '{quality: 85}'

# Convert to WebP
sharp -i logo.png -o logo.webp --webp '{quality: 85}'

# Resize and convert
sharp -i logo.png -o logo-80.avif --resize 80 80 --avif '{quality: 85}'
```

#### Using ImageMagick

```bash
# Convert to AVIF
magick logo.png -quality 85 logo.avif

# Convert to WebP
magick logo.png -quality 85 logo.webp

# Resize and convert
magick logo.png -resize 80x80 -quality 85 logo-80.avif
```

#### Using cwebp (WebP)

```bash
# Install on macOS
brew install webp

# Convert to WebP
cwebp -q 85 logo.png -o logo.webp

# Resize and convert
cwebp -q 85 -resize 80 80 logo.png -o logo-80.webp
```

## Implementation Status

✅ Code is ready to use optimized images:
- Header component uses `<picture>` with AVIF/WebP fallbacks
- Footer component uses `<picture>` with AVIF/WebP fallbacks
- CategoryIcons component uses `<picture>` with format fallbacks
- Responsive `sizes` attributes added for proper loading

## Next Steps

1. Create optimized image versions using tools above
2. Place optimized images in `frontend/public/`
3. Test that images load correctly
4. Verify PageSpeed Insights improvements

## Expected Results

After optimization:
- **logo.png**: Should reduce from 81.5 KiB to ~10-15 KiB (AVIF) or ~15-20 KiB (WebP)
- **category-vitamins-supplements.png**: Should reduce from 17.5 KiB to ~3-5 KiB (AVIF) or ~5-8 KiB (WebP)
- Improved LCP (Largest Contentful Paint) score
- Better PageSpeed Insights rating

## Browser Support

- **AVIF**: Supported in Chrome 85+, Firefox 93+, Safari 16+
- **WebP**: Supported in Chrome 23+, Firefox 65+, Safari 14+, Edge 18+
- **PNG**: Fallback for older browsers (automatically used if AVIF/WebP not supported)

The `<picture>` element automatically selects the best format supported by the browser.

