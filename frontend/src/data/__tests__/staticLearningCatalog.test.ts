import { STATIC_LEARNING_POSTS, listStaticLearningBlogs } from '../staticLearningCatalog';
import { getStaticLearningBlog } from '../staticLearningArticle';

describe('frontend static learning catalog', () => {
  test('lists 100+ guides with images', () => {
    const posts = listStaticLearningBlogs();
    expect(posts.length).toBeGreaterThanOrEqual(100);
    expect(STATIC_LEARNING_POSTS.length).toBe(posts.length);
    expect(posts.every((post) => post.featuredImage?.startsWith('/blog/'))).toBe(true);
  });

  test('filters by pet type and finds a trending slug', () => {
    const dogs = listStaticLearningBlogs({ petType: 'dog' });
    expect(dogs.length).toBeGreaterThan(20);
    expect(getStaticLearningBlog('best-fresh-dog-food-2026')?.title).toMatch(/fresh dog food/i);
  });
});
