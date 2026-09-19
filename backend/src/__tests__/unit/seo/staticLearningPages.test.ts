import {
  STATIC_LEARNING_PAGES,
  STATIC_LEARNING_PATHS,
  isStaticLearningSlug,
} from '../../../seo/staticLearningPages';
import {
  getStaticLearningBlog,
  listStaticLearningBlogs,
  mergeBlogLists,
} from '../../../seo/staticLearningCatalog';
import { classifyRoute } from '../../../seo/routeClassifier';

describe('trending static learning catalog', () => {
  const slugs = Object.keys(STATIC_LEARNING_PAGES);

  test('publishes at least 100 photo guides', () => {
    expect(slugs.length).toBeGreaterThanOrEqual(100);
    expect(STATIC_LEARNING_PATHS.length).toBe(slugs.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test('keeps the original sensitive-stomach guides', () => {
    expect(isStaticLearningSlug('best-dog-food-sensitive-stomach')).toBe(true);
    expect(isStaticLearningSlug('best-dog-foods-sensitive-stomachs')).toBe(true);
  });

  test('publishes a next-day delivery guide that stays indexable', () => {
    expect(isStaticLearningSlug('next-day-pet-delivery-within-50-miles-of-queens')).toBe(true);
    expect(STATIC_LEARNING_PAGES['next-day-pet-delivery-within-50-miles-of-queens'].html).toContain('/delivery-zips');
    expect(STATIC_LEARNING_PAGES['next-day-pet-delivery-within-50-miles-of-queens'].html).toMatch(/do not claim same-day nationwide/i);
    expect(classifyRoute('/learning/next-day-pet-delivery-within-50-miles-of-queens')).toMatchObject({
      indexable: true,
      status: 'indexable',
    });
  });

  test('publishes a new Fall 2026 playbook that stays indexable', () => {
    expect(isStaticLearningSlug('fall-2026-pet-care-playbook')).toBe(true);
    expect(STATIC_LEARNING_PAGES['fall-2026-pet-care-playbook'].html).toContain('/learning/best-fresh-dog-food-2026');
    expect(classifyRoute('/learning/fall-2026-pet-care-playbook')).toMatchObject({
      indexable: true,
      status: 'indexable',
    });
  });

  test('every guide has a unique title, description, image, and HTML body', () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    slugs.forEach((slug) => {
      const page = STATIC_LEARNING_PAGES[slug];
      expect(page.title.length).toBeGreaterThan(20);
      expect(page.description.length).toBeGreaterThan(80);
      expect(page.featuredImage).toMatch(/^\/blog\/[a-z0-9-]+\.jpg$/);
      expect(page.html).toContain('<img');
      expect(page.html).toContain('/blog/');
      expect(page.html.length).toBeGreaterThan(800);
      titles.add(page.title);
      descriptions.add(page.description);
      expect(classifyRoute(`/learning/${slug}`)).toMatchObject({
        indexable: true,
        status: 'indexable',
        routeType: 'static-learning',
      });
    });
    expect(titles.size).toBe(slugs.length);
    expect(descriptions.size).toBe(slugs.length);
  });

  test('catalog helpers return a blog payload for API and hub merges', () => {
    const latest = listStaticLearningBlogs()[0];
    expect(latest.featuredImage).toContain('/blog/');
    expect(getStaticLearningBlog(latest.slug)?.title).toBe(latest.title);
    const merged = mergeBlogLists(listStaticLearningBlogs(), [
      { ...latest, title: 'CMS override', _id: 'cms' } as typeof latest,
    ]);
    expect(merged.find((blog) => blog.slug === latest.slug)?.title).toBe('CMS override');
  });
});
