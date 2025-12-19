import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { blogService, Blog } from '@/services/blogs';
import { Search, Calendar, Eye, ChevronRight, BookOpen } from 'lucide-react';
import Dropdown from '@/components/Dropdown';

const Learning = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const petType = searchParams.get('petType') || '';
  const category = searchParams.get('category') || '';

  // Fetch blogs
  const { data: blogsData, isLoading } = useQuery({
    queryKey: ['blogs', page, petType, category, searchQuery],
    queryFn: () => blogService.getBlogs({
      page,
      limit: 12,
      petType: petType || undefined,
      category: category || undefined,
      search: searchQuery || undefined
    }),
    staleTime: 30 * 1000
  });

  // Fetch blog categories
  const { data: categories } = useQuery({
    queryKey: ['blog-categories', petType],
    queryFn: () => blogService.getBlogCategories(petType || undefined),
    staleTime: 10 * 60 * 1000
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery });
      setPage(1);
    }
  };

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    params.delete('page');
    setSearchParams(params);
    setPage(1);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Learning Center
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Expert advice, tips, and guides to help you care for your pets
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </form>

            <Dropdown
              options={[
                { value: '', label: 'All Categories' },
                ...(categories || []).map((cat: { name: string; count: number }) => ({
                  value: cat.name,
                  label: `${cat.name} (${cat.count})`
                }))
              ]}
              value={category}
              onChange={handleCategoryChange}
              placeholder="Filter by Category"
            />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen size={18} />
              <span>
                {blogsData?.pagination?.total || 0} {blogsData?.pagination?.total === 1 ? 'article' : 'articles'}
              </span>
            </div>
          </div>
        </div>

        {/* Blog List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading articles...</p>
          </div>
        ) : !blogsData?.data || blogsData.data.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-lg font-medium text-gray-600">No articles found</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchQuery || category
                ? 'Try adjusting your search or filters'
                : 'Check back soon for new articles'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {blogsData.data.map((blog: Blog) => (
                <Link
                  key={blog._id}
                  to={`/learning/${blog.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  {blog.featuredImage && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={blog.featuredImage}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-blue-600 uppercase">
                        {blog.category}
                      </span>
                      {blog.petType && blog.petType !== 'all' && (
                        <span className="text-xs text-gray-500 capitalize">
                          • {blog.petType}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {truncateText(blog.excerpt, 120)}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{blog.views || 0}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {blogsData.pagination && blogsData.pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => {
                    setPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {blogsData.pagination.pages}
                </span>
                <button
                  onClick={() => {
                    setPage(p => Math.min(blogsData.pagination.pages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === blogsData.pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Learning;

