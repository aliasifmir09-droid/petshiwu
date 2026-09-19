import { productSearchDescription, productSearchTitle } from '../../../seo/productSearchSnippet';

describe('product search snippets', () => {
  test('titles keep the full Hill\'s name and add in-stock free shipping', () => {
    const title = productSearchTitle({
      name: "Hill's Science Diet Sensitive Stomach & Skin Adult Dry Dog Food Chicken and Barley",
      brand: "Hill's Science Diet",
      inStock: true,
    });
    expect(title).not.toContain('...');
    expect(title).toContain("Hill's Science Diet Sensitive Stomach");
    expect(title).toMatch(/In stock · free ship \$49\+/);
    expect(title).toMatch(/Petshiwu$/);
  });

  test('clips at a sentence instead of leaving a dangling and', () => {
    const snippet = productSearchDescription({
      description:
        'Comfortable no-pull harness with reflective strips for safety. Adjustable straps fit multiple sizes. Front and back attachment points for training.',
    });
    expect(snippet.length).toBeLessThanOrEqual(160);
    expect(snippet).not.toMatch(/Front and In stock/);
    expect(snippet).toMatch(/multiple sizes\. In stock/);
    expect(snippet).toMatch(/In stock/);
  });

  test('descriptions stay at or under 160 characters and include in stock', () => {
    const snippet = productSearchDescription({
      description:
        "Hill's Science Diet Adult Sensitive Stomach & Skin Chicken Recipe dry dog food is formulated for dogs with food sensitivities.",
      brand: "Hill's Science Diet",
      name: 'Adult Sensitive Stomach',
      petType: 'dog',
    });
    expect(snippet.length).toBeLessThanOrEqual(160);
    expect(snippet).toMatch(/In stock/);
    expect(snippet).toMatch(/Free shipping over \$49/);
    expect(snippet).toMatch(/No autoship/);
  });
});
