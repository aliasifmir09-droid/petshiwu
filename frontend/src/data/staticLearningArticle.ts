import { Blog } from '@/services/blogs';
import { TRENDING_LEARNING_BY_SLUG } from './trendingLearningPosts';
import { CLASSIC_POSTS, toBlog } from './staticLearningCatalog';

export const getStaticLearningBlog = (slug: string): Blog | null => {
  const post = TRENDING_LEARNING_BY_SLUG[slug];
  if (post?.html) return toBlog(post, post.html);
  const classic = CLASSIC_POSTS.find((item) => item.slug === slug);
  return classic ? toBlog(classic) : null;
};
