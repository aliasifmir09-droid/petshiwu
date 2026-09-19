import { listStaticLearningBlogs } from './staticLearningCatalog';
import { FEATURED_LEARNING_SLUGS } from './featuredLearning';
import type { Blog } from '@/services/blogs';

export const relatedLearningPosts = (currentSlug: string, petType?: string, limit = 6): Blog[] => {
  const featured = new Set<string>(FEATURED_LEARNING_SLUGS);
  const pool = listStaticLearningBlogs();
  const scored = pool
    .filter((post) => post.slug && post.slug !== currentSlug)
    .sort((a, b) => {
      const samePetA = petType && a.petType === petType ? 0 : 1;
      const samePetB = petType && b.petType === petType ? 0 : 1;
      if (samePetA !== samePetB) return samePetA - samePetB;
      const featA = featured.has(a.slug) ? 0 : 1;
      const featB = featured.has(b.slug) ? 0 : 1;
      return featA - featB;
    });
  return scored.slice(0, limit);
};
