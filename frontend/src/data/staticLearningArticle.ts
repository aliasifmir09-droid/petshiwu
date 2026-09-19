import { Blog } from '@/services/blogs';
import { TRENDING_LEARNING_BY_SLUG } from './trendingLearningPosts';
import { CLASSIC_POSTS, toBlog } from './staticLearningCatalog';
import { FALL_2026_PLAYBOOK_HTML, FALL_2026_PLAYBOOK_META } from './fall2026Playbook';

export const getStaticLearningBlog = (slug: string): Blog | null => {
  if (slug === FALL_2026_PLAYBOOK_META.slug) {
    return toBlog(FALL_2026_PLAYBOOK_META, FALL_2026_PLAYBOOK_HTML);
  }
  const post = TRENDING_LEARNING_BY_SLUG[slug];
  if (post?.html) return toBlog(post, post.html);
  const classic = CLASSIC_POSTS.find((item) => item.slug === slug);
  return classic ? toBlog(classic) : null;
};
