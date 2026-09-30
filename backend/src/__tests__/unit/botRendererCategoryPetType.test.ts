import { buildCategoryHtml } from '../../middleware/botRenderer';

/**
 * Regression guard for the category-slug collision (found 2026-09-29).
 *
 * Six category slugs exist twice in the `categories` collection, once per
 * petType: dry-food, wet-food, treats, veterinary-diets, food-toppers,
 * fresh--frozen-food. With no unique index on `slug` alone, a petType-agnostic
 * lookup resolves the CAT document, so /dog/dry-food rendered the cat category
 * with petType=dog (0 matches) and served crawlers an empty page — hiding the
 * catalog's largest category (637 products) plus 4 more dog categories.
 *
 * These tests pin the two things that must hold for every dog category URL:
 * a category page must render an ItemList of its products, and it must never
 * fall into the "Browse this category" empty state.
 */
describe('buildCategoryHtml — category slug collision guard', () => {
  const template = '<html><head><title>t</title></head><body><div id="root"></div></body></html>';

  const dogDryFood = { _id: 'dog-1', name: 'Dry Food', slug: 'dry-food', petType: 'dog' };
  const catDryFood = { _id: 'cat-1', name: 'Dry Food', slug: 'dry-food', petType: 'cat' };

  // canonicalProductHref needs petType + category.slug + slug; productAnchorHtml
  // and productItemListSchema additionally require a truthy `name`.
  const product = (slug: string, petType = 'dog') => ({
    slug,
    name: `Product ${slug}`,
    brand: 'Brand',
    petType,
    category: { slug: 'dry-food', name: 'Dry Food' },
    basePrice: 24.99,
    inStock: true,
    images: ['https://cdn.example/x.webp'],
  });

  it('renders an ItemList and product links when the dog category resolves with its products', () => {
    const products = [product('a'), product('b')];
    const html = buildCategoryHtml(template, dogDryFood, 'dog', '/dog/dry-food', products);

    expect(html).toContain('ItemList');
    expect(html).toContain('/dog/dry-food/a');
    expect(html).toContain('/dog/dry-food/b');
    expect(html).not.toContain('Browse this category on Petshiwu.');
    expect(html).toContain('https://www.petshiwu.com/dog/dry-food');
  });

  it('falls into the empty state when no products resolve — the exact failure mode of the collision', () => {
    // This is what /dog/dry-food served to Googlebot before the fix: the CAT
    // category's id was used to query products for petType=dog, so the
    // intersection was empty and crawlers got no links and no ItemList.
    const html = buildCategoryHtml(template, catDryFood, 'dog', '/dog/dry-food', []);

    expect(html).not.toContain('ItemList');
    expect(html).toContain('Browse this category on Petshiwu.');
  });

  it('labels the category title with the petType from the route, not the resolved document', () => {
    const html = buildCategoryHtml(template, dogDryFood, 'dog', '/dog/dry-food', [product('a')]);
    expect(html).toContain('Dry Food — Dog Supplies Delivered');
  });

  it('keeps cat category pages rendering with the cat label', () => {
    const html = buildCategoryHtml(template, catDryFood, 'cat', '/cat/dry-food', [product('a', 'cat')]);
    expect(html).toContain('ItemList');
    expect(html).toContain('Dry Food — Cat Supplies Delivered');
    expect(html).toContain('https://www.petshiwu.com/cat/dry-food');
  });
});
