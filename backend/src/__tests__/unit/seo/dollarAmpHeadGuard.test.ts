/**
 * Regression guard for the `$&` head-corruption defect (Oct 2026).
 *
 * Nine live products store a raw Scene7 URL carrying the literal `$&` size
 * directive. Because that string was passed as the REPLACEMENT argument of
 * String.replace(), `$&` expanded into the matched `</head>` and was spliced
 * into the published og:image URL — corrupting the head on those pages.
 *
 * These tests assert the invariant on the REAL rendering entry point, with a
 * REAL stored URL shape, so the defect cannot silently return.
 */
import { buildProductHtml } from '../../../middleware/botRenderer';

// Verbatim shape of the value stored on the 9 affected products.
const S7 = 'https://s7d2.scene7.com/is/image/PetSmart/5362316?$sclp-prd-main_large$&fmt=jpeg&qlt=80';

const template = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8" />
<meta property="og:image" content="/og-image.jpg" />
</head>
<body><div id="root"></div></body></html>`;

const product = {
  name: 'Tiki Cat Kitten Baby Treats',
  slug: 'tiki-cat-kitten-baby-treats',
  description: 'Soft and chewy kitten treats.',
  brand: 'Tiki Cat',
  images: [S7, S7.replace('5362316?', '5362316_alt1?')],
  variants: [{ price: 4.49, inStock: true }],
};

const html = buildProductHtml(template, product, product.slug);

describe('$& in a stored image URL must not corrupt the rendered head', () => {
  test('emits exactly one </head>', () => {
    expect(html.match(/<\/head>/g)).toHaveLength(1);
  });

  test('never splices a tag inside a content attribute', () => {
    // the failure signature: content="...<meta ... / content="...<link ...
    expect(html).not.toMatch(/content="[^"]*<(meta|link|script)\b/i);
  });

  test('keeps the image URL intact, entity-escaped, with no stray </head>', () => {
    expect(html).toContain('$sclp-prd-main_large$&amp;fmt=jpeg');
    expect(html).not.toContain('$sclp-prd-main_large</head>');
  });

  test('the escaped URL still carries both query parameters', () => {
    expect(html).toContain('$&amp;fmt=jpeg&amp;qlt=80');
  });
});
