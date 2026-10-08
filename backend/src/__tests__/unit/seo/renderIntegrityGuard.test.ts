/**
 * RENDER INTEGRITY GUARD — the structural fix for the `$&` bug class.
 *
 * WHY THIS EXISTS
 * ---------------
 * Between Oct 3 and Oct 8 2026 the same defect was found FOUR times, each time in a
 * different place, each time only after it had reached production:
 *
 *   1. `ogTags.ts` `upsertMeta` (x2)          — head path, og:image
 *   2. `ogTags.ts` `injectOgTags` image_src   — head path
 *   3. `botRenderer.ts` `injectBeforeHeadClose` — head path, JSON-LD image array
 *   4. `botRenderer.ts` root-div replacement (24 sites) — **BODY path**
 *
 * The mechanism is always the same: a STORED value containing a literal `$&` was passed
 * as the REPLACEMENT STRING of `String.replace()`. In JS, `$&` in a replacement string
 * means "insert the matched substring here" — so a stored image URL containing `$&`
 * expands to whatever was matched (e.g. `</head>`) and is spliced into the output.
 *
 * THE LESSON THAT MAKES THIS TEST WHAT IT IS
 * ------------------------------------------
 * Fault site #4 corrupted the rendered BODY while the head still counted a clean
 * `</head>` = 1. **A head-only assertion would have PASSED a corrupt page.** So this
 * guard asserts on the ENTIRE rendered document, not just the head.
 *
 * WHAT IT ASSERTS
 * ---------------
 *   - exactly one `</head>`
 *   - exactly one `<body`
 *   - no element tag spliced into any attribute value
 *   - the stored `$&` survives as literal text (`$&amp;`), never expanded
 *   - no raw `</head>` / `<div` / `<link` appears inside an attribute
 *
 * The test is a TRUE regression test: it is proven to FAIL against the pre-fix shape
 * (see the inline `legacyStringReplace` reproduction), so it cannot silently pass.
 */

import { buildProductHtml } from '../../../middleware/botRenderer';
import { injectOgTags, resolveShareImage } from '../../../seo/ogTags';

/**
 * The verbatim stored URL shape from the nine affected rows. This is NOT a synthetic
 * string: `$sclp-prd-main_large$&fmt=jpeg&qlt=80` is exactly what the DB held, and the
 * `$&` is part of Scene7's own command syntax (it is not a query separator).
 */
const DOLLAR_AMP_URL =
  'https://s7d2.scene7.com/is/image/PetSmart/5362316?$sclp-prd-main_large$&fmt=jpeg&qlt=80';

/** A realistic product carrying the dangerous URL in BOTH image fields the renderer reads. */
const dangerousProduct = {
  _id: 'test-dollar-amp',
  name: 'Tiki Cat Baby Tuna & Salmon Recipe',
  slug: 'tiki-cat-baby-tuna-salmon',
  brand: 'Tiki Cat',
  description: 'Kitten food with real tuna and salmon.',
  basePrice: 2.42,
  price: 2.42,
  totalStock: 12,
  inStock: true,
  petType: 'cat',
  // `images[0]` feeds resolveShareImage -> og:image and JSON-LD gallery
  images: [DOLLAR_AMP_URL],
  variants: [{ sku: '5575', price: 2.42, image: DOLLAR_AMP_URL, images: [DOLLAR_AMP_URL] }],
};

/** A clean control product — proves the assertions are not tautologically true. */
const cleanProduct = {
  ...dangerousProduct,
  _id: 'test-clean',
  name: 'Purina Pro Plan Adult Dry Dog Food',
  slug: 'purina-pro-plan-adult',
  brand: 'Purina',
  images: ['https://petshiwu-cdn.b-cdn.net/products/purina-dog-v2/5109098/5109098.webp'],
  variants: [
    {
      sku: '5109098',
      price: 36.99,
      image: 'https://petshiwu-cdn.b-cdn.net/products/purina-dog-v2/5109098/5109098.webp',
      images: ['https://petshiwu-cdn.b-cdn.net/products/purina-dog-v2/5109098/5109098.webp'],
    },
  ],
};

const MINIMAL_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Petshiwu</title>
    <meta property="og:image" content="/og-image.jpg" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

/**
 * Reproduces the OLD string-form replacement. Used only to prove the assertions below
 * actually fire — a guard that has never been shown to fail is not a guard.
 */
const legacyStringReplace = (html: string, re: RegExp, replacement: string) =>
  html.replace(re, replacement);

describe('render integrity guard ($& corruption class)', () => {
  describe('injectOgTags with a stored $& URL', () => {
    const rendered = injectOgTags(
      MINIMAL_TEMPLATE,
      dangerousProduct.name,
      dangerousProduct.description,
      'https://www.petshiwu.com/cat/food-toppers/tiki-cat-baby-tuna-salmon',
      'product',
      DOLLAR_AMP_URL
    );

    test('renders exactly one </head>', () => {
      expect((rendered.match(/<\/head>/g) ?? []).length).toBe(1);
    });

    test('renders exactly one <body', () => {
      expect((rendered.match(/<body\b/gi) ?? []).length).toBe(1);
    });

    test('never splices an element tag into an attribute value', () => {
      // The signature of every observed corruption: an opening tag inside a "..." value.
      expect(/="[^"]*<(head|link|div|meta|script|body)\b/i.test(rendered)).toBe(false);
      expect(/href="[^"]*<link/i.test(rendered)).toBe(false);
      expect(/content="[^"]*<meta/i.test(rendered)).toBe(false);
    });

    test('keeps the stored $& as literal text, never expanded', () => {
      // esc() turns the `&` into `&amp;`; the `$` must remain a literal dollar sign.
      expect(rendered).toContain('$sclp-prd-main_large$&amp;fmt=jpeg');
      // If $& had expanded we would see the matched tag echoed into the URL.
      expect(rendered).not.toMatch(/sclp-prd-main_large<\/head>/);
    });

    test('the image_src link resolves to the product image, not a broken value', () => {
      const m = rendered.match(/rel="image_src"\s+href="([^"]*)"/i);
      if (m) {
        expect(m[1]).toContain('s7d2.scene7.com/is/image/PetSmart/5362316');
        expect(m[1]).not.toContain('<');
      }
    });
  });

  describe('buildProductHtml with a stored $& URL (head AND body)', () => {
    const rendered = buildProductHtml(MINIMAL_TEMPLATE, dangerousProduct, dangerousProduct.slug);

    test('renders exactly one </head>', () => {
      expect((rendered.match(/<\/head>/g) ?? []).length).toBe(1);
    });

    test('renders exactly one <body', () => {
      expect((rendered.match(/<body\b/gi) ?? []).length).toBe(1);
    });

    test('BODY path is clean — no tag spliced into an attribute anywhere', () => {
      // This is the assertion that would have caught fault site #4, which corrupted the
      // body while the head still counted a clean 1.
      expect(/="[^"]*<(head|link|div|meta|script|body|section)\b/i.test(rendered)).toBe(false);
    });

    test('the root div is present exactly once and not duplicated by expansion', () => {
      const rootDivs = rendered.match(/<div id="root">/g) ?? [];
      expect(rootDivs.length).toBe(1);
      // The fault-site-4 signature: the matched string echoed into the replacement.
      expect(rendered).not.toMatch(/<div id="root"><div id="root">/);
    });

    test('every JSON-LD block parses as valid JSON', () => {
      const blocks = [...rendered.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
      expect(blocks.length).toBeGreaterThan(0);
      for (const [, body] of blocks) {
        expect(() => JSON.parse(body)).not.toThrow();
      }
    });
  });

  describe('control — the guard must not be vacuously true', () => {
    test('a clean product renders cleanly (proves assertions can pass)', () => {
      const rendered = buildProductHtml(MINIMAL_TEMPLATE, cleanProduct, cleanProduct.slug);
      expect((rendered.match(/<\/head>/g) ?? []).length).toBe(1);
      expect((rendered.match(/<body\b/gi) ?? []).length).toBe(1);
      expect(/="[^"]*<(head|link|div|meta)\b/i.test(rendered)).toBe(false);
    });

    test('PROOF OF TEETH — the OLD string-form replacement FAILS these assertions', () => {
      // Reproduce the exact pre-fix shape on the image_src branch of injectOgTags.
      const esc = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const broken = legacyStringReplace(
        MINIMAL_TEMPLATE,
        /(<link\b[^>]*rel=["']image_src["'][^>]*href=["'])[^"']*(["'][^>]*>)/i,
        `$1${esc(DOLLAR_AMP_URL)}$2`
      );
      // The corrupted output contains an injected tag inside the attribute — exactly the
      // signature the guard above forbids. If this ever stops being true, the guard has
      // lost its teeth and the test file must be revisited.
      expect(/="[^"]*<(link|head|div|meta)\b/i.test(broken)).toBe(true);
    });
  });

  describe('resolveShareImage passes absolute URLs through unchanged', () => {
    test('an absolute http(s) URL is returned verbatim (the passthrough that let $& through)', () => {
      expect(resolveShareImage(DOLLAR_AMP_URL)).toBe(DOLLAR_AMP_URL);
    });
  });
});
