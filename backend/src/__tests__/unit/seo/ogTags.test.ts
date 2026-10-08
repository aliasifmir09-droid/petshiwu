import fs from 'fs';
import path from 'path';
import { DEFAULT_OG_IMAGE, injectOgTags, resolveShareImage, toPublicProductImageUrl } from '../../../seo/ogTags';
import { looksLikeStaticAsset } from '../../../seo/staticAssetPath';

describe('resolveShareImage', () => {
  test('defaults to the branded 1200x630 share image', () => {
    expect(resolveShareImage()).toBe(DEFAULT_OG_IMAGE);
    expect(resolveShareImage('')).toBe(DEFAULT_OG_IMAGE);
    expect(resolveShareImage(null)).toBe(DEFAULT_OG_IMAGE);
  });

  test('rewrites disabled Cloudinary product photos to Bunny CDN', () => {
    expect(
      resolveShareImage(
        'https://res.cloudinary.com/dtmes0dha/image/upload/v1779056475/petshiwu/products/6975f1965f8fb0a308f8d7af.jpg'
      )
    ).toBe('https://petshiwu-cdn.b-cdn.net/products/6975f1965f8fb0a308f8d7af.jpg');
    expect(
      toPublicProductImageUrl(
        'https://res.cloudinary.com/dtmes0dha/image/upload/v1/petshiwu/products/abc_v0.jpg'
      )
    ).toBe('https://petshiwu-cdn.b-cdn.net/products/abc_v0.jpg');
  });

  test('rewrites Bunny URLs that still have the Cloudinary path', () => {
    expect(
      toPublicProductImageUrl(
        'https://petshiwu-cdn.b-cdn.net/dtmes0dha/image/upload/v1779056475/petshiwu/products/6975f1965f8fb0a308f8d7af.jpg'
      )
    ).toBe('https://petshiwu-cdn.b-cdn.net/products/6975f1965f8fb0a308f8d7af.jpg');
  });

  test('drops Cloudinary URLs that cannot be mapped to Bunny', () => {
    expect(toPublicProductImageUrl('https://res.cloudinary.com/dtmes0dha/image/upload/v1/logo.png')).toBeUndefined();
    expect(resolveShareImage('https://res.cloudinary.com/dtmes0dha/image/upload/v1/logo.png')).toBe(
      DEFAULT_OG_IMAGE
    );
  });

  test('keeps absolute http(s) URLs that are not on the disabled Cloudinary cloud', () => {
    expect(resolveShareImage('https://cdn.example.com/food.jpg')).toBe(
      'https://cdn.example.com/food.jpg'
    );
    expect(resolveShareImage('https://petshiwu-cdn.b-cdn.net/products/food.jpg')).toBe(
      'https://petshiwu-cdn.b-cdn.net/products/food.jpg'
    );
  });

  test('prefixes relative paths', () => {
    expect(resolveShareImage('/banners/hero.jpg')).toBe(
      'https://www.petshiwu.com/banners/hero.jpg'
    );
  });

  test('reads url from image objects', () => {
    expect(resolveShareImage({ url: 'https://cdn.example.com/a.jpg' })).toBe(
      'https://cdn.example.com/a.jpg'
    );
  });
});

describe('injectOgTags', () => {
  const shell = `<!doctype html><html><head>
    <title>Premium Pet Food & Supplies | Petshiwu NYC</title>
    <meta property="og:title" content="old title">
    <meta property="og:description" content="old desc">
    <meta property="og:url" content="https://www.petshiwu.com/">
    <meta property="og:type" content="website">
  </head><body></body></html>`;

  test('injects a real og:image when the template has none', () => {
    const html = injectOgTags(
      shell,
      'Dog Food Delivery NYC | Petshiwu',
      'Same-day dog food delivery in NYC.',
      'https://www.petshiwu.com/dog-food-delivery-nyc'
    );
    expect(html).toContain(`property="og:image" content="${DEFAULT_OG_IMAGE}"`);
    expect(html).toContain(`property="og:image:width" content="1200"`);
    expect(html).toContain(`property="og:image:height" content="630"`);
    expect(html).toContain(`name="twitter:image" content="${DEFAULT_OG_IMAGE}"`);
    expect(html).toContain('rel="image_src" href="https://www.petshiwu.com/og-image.jpg"');
    expect(html).toContain('Dog Food Delivery NYC | Petshiwu');
    expect(html).toContain('https://www.petshiwu.com/dog-food-delivery-nyc');
  });

  test('keeps a product photo instead of the default share image', () => {
    const html = injectOgTags(
      shell,
      'Hill\'s Science Diet | Petshiwu',
      'Adult dog food.',
      'https://www.petshiwu.com/dog/food/hills',
      'product',
      'https://cdn.example.com/hills.jpg'
    );
    expect(html).toContain('property="og:image" content="https://cdn.example.com/hills.jpg"');
    expect(html).toContain('property="og:type" content="product"');
    expect(html).not.toMatch(/property="og:image" content="https:\/\/www\.petshiwu\.com\/og-image\.jpg"/);
  });

  test('updates the real homepage template so bots see og:image without JavaScript', () => {
    const template = fs.readFileSync(
      path.join(__dirname, '../../../../../frontend/index.html'),
      'utf8'
    );
    expect(template).toContain('https://www.petshiwu.com/og-image.jpg');
    const html = injectOgTags(
      template,
      'Dog Food Delivery NYC | Petshiwu',
      'Same-day dog food delivery in NYC.',
      'https://www.petshiwu.com/dog-food-delivery-nyc'
    );
    expect(html).toContain('property="og:title" content="Dog Food Delivery NYC | Petshiwu"');
    expect(html).toContain(`property="og:image" content="${DEFAULT_OG_IMAGE}"`);
    expect(html).toContain('property="og:url" content="https://www.petshiwu.com/dog-food-delivery-nyc"');
  });

  // Regression: a Scene7 image URL containing the `$&` size directive used to be
  // passed as a String.replace() REPLACEMENT string, where `$&` expands to the whole
  // matched tag — injecting a complete <meta> tag inside the content="" attribute and
  // corrupting the <head>. Verified live on 9 products (Oct 3 2026).
  test('does not let $& in an image URL corrupt the head', () => {
    const s7 = 'https://s7d2.scene7.com/is/image/PetSmart/5284286?$sclp-prd-main_large$&fmt=jpeg&qlt=80';
    const template = [
      '<html><head>',
      '<meta property="og:image" content="https://www.petshiwu.com/og-image.jpg" />',
      '</head><body></body></html>',
    ].join('\n');

    const html = injectOgTags(template, 'T', 'D', 'https://www.petshiwu.com/cat/dry-food/x', 'product', s7);

    // exactly one og:image tag — no nested injection
    expect(html.match(/property="og:image"/g)).toHaveLength(1);
    // exactly one head close — no stray </head> injected into an attribute
    expect(html.match(/<\/head>/g)).toHaveLength(1);
    // no raw unescaped $& left in the attribute value
    expect(html).not.toContain('$&fmt');
    // the URL survives, HTML-escaped
    expect(html).toContain('$sclp-prd-main_large$&amp;fmt=jpeg&amp;qlt=80');
  });

  test('preserves the tag structure when the template already has an og:image', () => {
    const s7 = 'https://s7d2.scene7.com/is/image/PetSmart/1234?$sclp-prd-main_large$&fmt=jpeg';
    const template = '<html><head><meta property="og:image" content="https://old/x.jpg" /></head><body></body></html>';
    const html = injectOgTags(template, 'T', 'D', 'https://www.petshiwu.com/p', 'product', s7);
    // the old value is replaced, not nested
    expect(html).not.toContain('https://old/x.jpg');
    expect(html.match(/property="og:image"/g)).toHaveLength(1);
    expect(html.match(/<\/head>/g)).toHaveLength(1);
    expect(html.match(/<link rel="image_src"/g)).toHaveLength(1);
    expect(html).toContain('$sclp-prd-main_large$&amp;fmt=jpeg');
  });
});

describe('looksLikeStaticAsset', () => {
  test('treats missing image/js/css paths as files, not SPA routes', () => {
    expect(looksLikeStaticAsset('/og-image.jpg')).toBe(true);
    expect(looksLikeStaticAsset('/logo.png')).toBe(true);
    expect(looksLikeStaticAsset('/assets/app.js')).toBe(true);
    expect(looksLikeStaticAsset('/missing.webp?v=1')).toBe(true);
  });

  test('does not treat real pages as files', () => {
    expect(looksLikeStaticAsset('/')).toBe(false);
    expect(looksLikeStaticAsset('/dog-food-delivery-nyc')).toBe(false);
    expect(looksLikeStaticAsset('/dog/food/hills-science-diet')).toBe(false);
    expect(looksLikeStaticAsset('/products')).toBe(false);
  });
});
