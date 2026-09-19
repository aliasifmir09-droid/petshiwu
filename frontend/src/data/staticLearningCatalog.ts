import { Blog } from '@/services/blogs';
import { TRENDING_LEARNING_META, TrendingLearningMeta } from './trendingLearningMeta';
import { FALL_2026_PLAYBOOK_META } from './fall2026Playbook';
import { NEXT_DAY_DELIVERY_GUIDE_META } from './nextDayDeliveryGuide';
import { LEARNING_AUTHOR, LEARNING_REVIEWED_AT } from './featuredLearning';

export type StaticLearningCard = TrendingLearningMeta;

const CLASSIC_POSTS: TrendingLearningMeta[] = [
  NEXT_DAY_DELIVERY_GUIDE_META,
  FALL_2026_PLAYBOOK_META,
  {
    slug: 'best-dog-food-sensitive-stomach',
    title: 'Best Dog Food for Sensitive Stomachs: A 2026 Expert Guide',
    description:
      "Is your dog struggling with digestive issues? Discover the best dog food for sensitive stomachs, including grain-free and limited ingredient diets at Petshiwu.",
    publishedAt: '2026-01-15T00:00:00.000Z',
    featuredImage: '/blog/kibble-bowl.jpg',
    featuredImageWebp: '/blog/kibble-bowl.webp',
    imageAlt: 'A Labrador eating from a bowl of easily digestible dog food',
    petType: 'dog',
    category: 'Nutrition',
    tags: ['sensitive stomach', 'dog food', 'digestive health', 'limited ingredient'],
    excerpt:
      "Is your dog struggling with digestive issues? Discover the best dog food for sensitive stomachs, including grain-free and limited ingredient diets at Petshiwu.",
    shopPath: '/dog',
  },
  {
    slug: 'best-dog-foods-sensitive-stomachs',
    title: '10 Best Dog Foods for Sensitive Stomachs [Guide]',
    description:
      'Discover the best dog foods for sensitive stomachs. Expert-reviewed formulas with easily digestible ingredients, probiotics, and limited ingredients.',
    publishedAt: '2024-01-15T00:00:00.000Z',
    featuredImage: '/blog/kibble-bowl.jpg',
    featuredImageWebp: '/blog/kibble-bowl.webp',
    imageAlt: 'Dog food in a bowl for sensitive stomachs',
    petType: 'dog',
    category: 'Nutrition',
    tags: ['sensitive stomach', 'dog food', 'probiotics', 'limited ingredient'],
    excerpt:
      'Discover the best dog foods for sensitive stomachs. Expert-reviewed formulas with easily digestible ingredients, probiotics, and limited ingredients.',
    shopPath: '/dog',
  },
];

export const STATIC_LEARNING_POSTS: TrendingLearningMeta[] = [
  ...CLASSIC_POSTS,
  ...TRENDING_LEARNING_META,
];

const toBlog = (post: TrendingLearningMeta, html = ''): Blog => ({
  _id: `static-${post.slug}`,
  title: post.title,
  slug: post.slug,
  content: html,
  excerpt: post.excerpt || post.description,
  featuredImage: post.featuredImage,
  petType: post.petType,
  category: post.category,
  author: {
    _id: 'petshiwu-care-desk',
    name: LEARNING_AUTHOR,
    email: 'hello@petshiwu.com',
  },
  tags: post.tags,
  isPublished: true,
  publishedAt: post.publishedAt,
  views: 0,
  metaTitle: post.title,
  metaDescription: post.description,
  createdAt: post.publishedAt,
  updatedAt: LEARNING_REVIEWED_AT,
});

export type StaticBlogQuery = {
  petType?: string;
  category?: string;
  search?: string;
};

const matchesQuery = (blog: Blog, query: StaticBlogQuery): boolean => {
  if (query.petType && query.petType !== 'all' && blog.petType !== query.petType && blog.petType !== 'all') {
    return false;
  }
  if (query.category && blog.category !== query.category) {
    return false;
  }
  if (query.search) {
    const haystack = `${blog.title} ${blog.excerpt || ''} ${blog.tags.join(' ')}`.toLowerCase();
    if (!haystack.includes(query.search.toLowerCase())) return false;
  }
  return true;
};

export const listStaticLearningBlogs = (query: StaticBlogQuery = {}): Blog[] =>
  STATIC_LEARNING_POSTS
    .map((post) => toBlog(post))
    .filter((blog) => matchesQuery(blog, query))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

export const listStaticLearningCategories = (petType?: string): Array<{ name: string; count: number }> => {
  const counts = new Map<string, number>();
  listStaticLearningBlogs({ petType }).forEach((blog) => {
    counts.set(blog.category, (counts.get(blog.category) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const mergeBlogLists = (staticBlogs: Blog[], cmsBlogs: Blog[] = []): Blog[] => {
  const bySlug = new Map<string, Blog>();
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

export { toBlog, CLASSIC_POSTS };
