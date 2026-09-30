import { generateSitemap } from '../../controllers/sitemapController';
import Category from '../../models/Category';
import Product from '../../models/Product';
import Blog from '../../models/Blog';
import CareGuide from '../../models/CareGuide';
import FAQ from '../../models/FAQ';
import PetType from '../../models/PetType';

/**
 * Regression guard for the sitemap double-dash exclusion (found 2026-09-30).
 *
 * BROKEN_SLUG_RE carried a bare `--+` alternative intended to catch
 * HTML-entity corruption. But this taxonomy uses `--` as the "&" separator
 * (dog/bones-bully-sticks--chews, dog/fresh--frozen-food). Because the same
 * isCleanSlug() guard is applied to CATEGORY slugs as well as product slugs,
 * every category whose name contains "&" was silently dropped from the
 * sitemap - 8 categories, 7 of them healthy, holding 721 live products whose
 * canonical /{petType}/{category}/{slug} URLs therefore never appeared either.
 *
 * These tests assert at the OUTPUT layer (the emitted XML) rather than by
 * re-implementing the regex, so a future refactor of the filter is still
 * caught as long as it changes what Google receives.
 */

// The controller mocks the mongoose models, so drive it with a fake res.
const runSitemap = async (): Promise<string> => {
  let body = '';
  const res: any = {
    set: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    send: jest.fn((b: string) => { body = b; return res; }),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn(),
  };
  await generateSitemap({} as any, res);
  return body;
};

// Minimal query-chain stub. The controller chains differently per model:
// Category/Blog/... use .select().lean(); Product uses .select().populate().lean().
// Each link returns the same chainable object so any of those paths resolve.
const query = (rows: any[]) => {
  const chain: any = {
    select: () => chain,
    populate: () => chain,
    sort: () => chain,
    limit: () => chain,
    lean: async () => rows,
    then: (res: any) => Promise.resolve(rows).then(res),
  };
  return chain;
};

describe('sitemap - categories with "&" (double-dash slugs) must be included', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const healthCat = {
    _id: 'c1',
    name: 'Bones, Bully Sticks & Chews',
    slug: 'bones-bully-sticks--chews',
    petType: 'dog',
    updatedAt: new Date('2026-09-30'),
  };
  const freshCat = {
    _id: 'c2',
    name: 'Fresh & Frozen Food',
    slug: 'fresh--frozen-food',
    petType: 'dog',
    updatedAt: new Date('2026-09-30'),
  };
  const plainCat = {
    _id: 'c3',
    name: 'Dry Food',
    slug: 'dry-food',
    petType: 'dog',
    updatedAt: new Date('2026-09-30'),
  };
  const ampCorruptCat = {
    _id: 'c4',
    name: 'Cages Habitats &amp; Hutches',
    slug: 'cages-habitats-amp-hutches',
    petType: 'small-pet',
    updatedAt: new Date('2026-09-30'),
  };

  const wire = (categories: any[], products: any[] = []) => {
    jest.spyOn(Category, 'find').mockReturnValue(query(categories) as any);
    jest.spyOn(Product, 'find').mockReturnValue(query(products) as any);
    jest.spyOn(Blog, 'find').mockReturnValue(query([]) as any);
    jest.spyOn(CareGuide, 'find').mockReturnValue(query([]) as any);
    jest.spyOn(FAQ, 'find').mockReturnValue(query([]) as any);
    jest.spyOn(PetType, 'find').mockReturnValue(query([]) as any);
  };

  it('emits the canonical URL for a category whose name contains "&"', async () => {
    wire([healthCat, freshCat, plainCat]);
    const xml = await runSitemap();

    expect(xml).toContain('/dog/bones-bully-sticks--chews');
    expect(xml).toContain('/dog/fresh--frozen-food');
    expect(xml).toContain('/dog/dry-food');
  });

  it('still excludes genuinely corrupted category slugs', async () => {
    wire([ampCorruptCat, plainCat]);
    const xml = await runSitemap();

    expect(xml).not.toContain('cages-habitats-amp-hutches');
    expect(xml).toContain('/dog/dry-food');
  });

  it('emits the canonical product URL for a product inside a "&" category', async () => {
    const product = {
      _id: 'p1',
      name: 'Bully Stick 6in',
      slug: 'bully-stick-6in',
      petType: 'dog',
      category: { slug: 'bones-bully-sticks--chews', name: 'Bones, Bully Sticks & Chews' },
      images: [],
      updatedAt: new Date('2026-09-30'),
    };
    wire([healthCat], [product]);
    const xml = await runSitemap();

    expect(xml).toContain('/dog/bones-bully-sticks--chews/bully-stick-6in');
  });

  it('still excludes product slugs with HTML-entity corruption', async () => {
    const corrupt = {
      _id: 'p2',
      name: 'Nut & Fruit Blend',
      slug: 'kaytee-nut-amp-fruit-blend-2-lb',
      petType: 'bird',
      category: { slug: 'dry-food', name: 'Dry Food' },
      images: [],
      updatedAt: new Date('2026-09-30'),
    };
    const good = {
      _id: 'p3',
      name: 'Fine Product',
      slug: 'fine-product',
      petType: 'dog',
      category: { slug: 'dry-food', name: 'Dry Food' },
      images: [],
      updatedAt: new Date('2026-09-30'),
    };
    wire([plainCat], [corrupt, good]);
    const xml = await runSitemap();

    expect(xml).not.toContain('kaytee-nut-amp-fruit-blend');
    expect(xml).toContain('fine-product');
  });
});
