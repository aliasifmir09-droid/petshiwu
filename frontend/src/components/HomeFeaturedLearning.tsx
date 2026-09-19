import { Link } from 'react-router-dom';
import { listStaticLearningBlogs } from '@/data/staticLearningCatalog';
import { FEATURED_LEARNING_SLUGS } from '@/data/featuredLearning';

const HomeFeaturedLearning = () => {
  const featured = new Set<string>(FEATURED_LEARNING_SLUGS);
  const posts = listStaticLearningBlogs()
    .filter((post) => featured.has(post.slug))
    .sort((a, b) => {
      const order = FEATURED_LEARNING_SLUGS as readonly string[];
      return order.indexOf(a.slug) - order.indexOf(b.slug);
    })
    .slice(0, 8);

  if (posts.length === 0) return null;

  return (
    <section className="py-14 bg-[#F8FAFC] border-y border-slate-100">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 mb-2">
              New for Fall 2026
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] leading-tight">
              Pet care guides Google can use — and you can shop from
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              A new playbook plus the high-intent guides pet parents search most. The rest of the
              indexed library stays at every old URL.
            </p>
          </div>
          <Link to="/learning" className="text-sm font-semibold text-[#1E3A8A] hover:underline">
            Browse all guides
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/learning/${post.slug}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100"
            >
              {post.featuredImage && (
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <p className="text-xs font-semibold uppercase text-[#D97706] mb-1">{post.category}</p>
                <h3 className="text-sm font-bold text-gray-900 line-clamp-3 leading-snug">
                  {post.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeFeaturedLearning;
