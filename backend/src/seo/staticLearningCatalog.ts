import { IBlogResponse } from '../types/blog';
import { STATIC_LEARNING_PAGES, StaticLearningPage } from './staticLearningPages';
import { LEARNING_AUTHOR, LEARNING_AUTHOR_URL, LEARNING_REVIEWED_AT } from './featuredLearning';

export const STATIC_LEARNING_AUTHOR = {
  _id: 'petshiwu-care-desk',
  name: LEARNING_AUTHOR,
  email: 'hello@petshiwu.com',
};

export const staticPageToBlog = (page: StaticLearningPage): IBlogResponse => ({
  _id: `static-${page.slug}`,
  title: page.title,
  slug: page.slug,
  content: page.html,
  excerpt: page.excerpt || page.description,
  featuredImage: page.featuredImage,
  petType: page.petType || 'all',
  category: page.category || 'Pet Care',
  author: STATIC_LEARNING_AUTHOR,
  tags: page.tags || [],
  isPublished: true,
  publishedAt: page.publishedAt,
  views: 0,
  metaTitle: page.title,
  metaDescription: page.description,
  speakable: false,
  authorByline: LEARNING_AUTHOR,
  authorProfileUrl: LEARNING_AUTHOR_URL,
  createdAt: page.publishedAt,
  updatedAt: LEARNING_REVIEWED_AT,
});

export type StaticBlogQuery = {
  petType?: string;
  category?: string;
  search?: string;
};

const matchesQuery = (blog: IBlogResponse, query: StaticBlogQuery): boolean => {
  if (query.petType && query.petType !== 'all' && blog.petType !== query.petType && blog.petType !== 'all') {
    return false;
  }
  if (query.category && blog.category !== query.category) {
    return false;
  }
  if (query.search) {
    const haystack = `${blog.title} ${blog.excerpt || ''} ${blog.tags.join(' ')} ${blog.content}`.toLowerCase();
    if (!haystack.includes(query.search.toLowerCase())) return false;
  }
  return true;
};

export const listStaticLearningBlogs = (query: StaticBlogQuery = {}): IBlogResponse[] =>
  Object.values(STATIC_LEARNING_PAGES)
    .map(staticPageToBlog)
    .filter((blog) => matchesQuery(blog, query))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

export const getStaticLearningBlog = (slug: string): IBlogResponse | null => {
  const page = STATIC_LEARNING_PAGES[slug];
  return page ? staticPageToBlog(page) : null;
};

export const staticLearningCategoryCounts = (
  petType?: string
): Array<{ name: string; count: number }> => {
  const counts = new Map<string, number>();
  listStaticLearningBlogs({ petType }).forEach((blog) => {
    counts.set(blog.category, (counts.get(blog.category) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const staticLearningCategoriesByPetType = (): Array<{
  petType: string;
  categories: Array<{ name: string; count: number }>;
}> => {
  const byPet = new Map<string, Map<string, number>>();
  listStaticLearningBlogs().forEach((blog) => {
    const petMap = byPet.get(blog.petType) || new Map<string, number>();
    petMap.set(blog.category, (petMap.get(blog.category) || 0) + 1);
    byPet.set(blog.petType, petMap);
  });
  return [...byPet.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([petType, categories]) => ({
      petType,
      categories: [...categories.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
};

export const mergeBlogLists = (
  staticBlogs: IBlogResponse[],
  cmsBlogs: IBlogResponse[]
): IBlogResponse[] => {
  const bySlug = new Map<string, IBlogResponse>();
  (Array.isArray(staticBlogs) ? staticBlogs : []).forEach((blog) => {
    if (blog?.slug) bySlug.set(blog.slug, blog);
  });
  (Array.isArray(cmsBlogs) ? cmsBlogs : []).forEach((blog) => {
    if (blog?.slug) bySlug.set(blog.slug, blog);
  });
  return [...bySlug.values()].sort((a, b) =>
    String(b.publishedAt || b.createdAt || '').localeCompare(String(a.publishedAt || a.createdAt || ''))
  );
};
