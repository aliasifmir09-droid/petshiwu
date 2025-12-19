import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { careGuideService, CareGuide } from '@/services/careGuides';
import { Search, Clock, Eye, BookOpen, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Dropdown from '@/components/Dropdown';
import LoadingSpinner from '@/components/LoadingSpinner';
import { normalizeImageUrl } from '@/utils/imageUtils';

const CareGuides = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const petType = searchParams.get('petType') || '';
  const category = searchParams.get('category') || '';
  const difficulty = searchParams.get('difficulty') || '';

  // Fetch care guides
  const { data: guidesData, isLoading } = useQuery({
    queryKey: ['care-guides', page, petType, category, searchQuery, difficulty],
    queryFn: () => careGuideService.getCareGuides({
      page,
      limit: 12,
      petType: petType || undefined,
      category: category || undefined,
      search: searchQuery || undefined,
      difficulty: difficulty || undefined
    }),
    staleTime: 30 * 1000
  });

  // Fetch care guide categories
  const { data: categories } = useQuery({
    queryKey: ['care-guide-categories', petType],
    queryFn: () => careGuideService.getCareGuideCategories(petType || undefined),
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

  const handleDifficultyChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('difficulty', value);
    } else {
      params.delete('difficulty');
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

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return <TrendingDown size={16} className="text-green-600" />;
      case 'intermediate':
        return <Minus size={16} className="text-yellow-600" />;
      case 'advanced':
        return <TrendingUp size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={32} className="text-primary-600" />
            <h1 className="text-4xl font-bold">Pet Care Guides</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Comprehensive guides to help you care for your pets
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search care guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Dropdown
                options={[
                  { value: '', label: 'All Categories' },
                  ...(categories || []).map((cat: any) => ({
                    value: cat.name,
                    label: `${cat.name} (${cat.count})`
                  }))
                ]}
                value={category}
                onChange={handleCategoryChange}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <Dropdown
                options={[
                  { value: '', label: 'All Levels' },
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
                value={difficulty}
                onChange={handleDifficultyChange}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Care Guides Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : guidesData && guidesData.data.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {guidesData.data.map((guide: CareGuide) => (
                <Link
                  key={guide._id}
                  to={`/care-guides/${guide.slug}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  {guide.featuredImage && (
                    <div className="aspect-video overflow-hidden bg-gray-200">
                      <img
                        src={normalizeImageUrl(guide.featuredImage)}
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(guide.difficulty)}`}>
                        {getDifficultyIcon(guide.difficulty)}
                        <span className="ml-1 capitalize">{guide.difficulty || 'General'}</span>
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {guide.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary-600 transition-colors">
                      {guide.title}
                    </h3>
                    {guide.excerpt && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {guide.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {guide.readingTime && (
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{guide.readingTime} min read</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Eye size={16} />
                        <span>{guide.views} views</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {guidesData.pagination.pages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    setPage(p => Math.max(1, p - 1));
                    setSearchParams({ ...Object.fromEntries(searchParams), page: String(Math.max(1, page - 1)) });
                  }}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {guidesData.pagination.pages}
                </span>
                <button
                  onClick={() => {
                    setPage(p => Math.min(guidesData.pagination.pages, p + 1));
                    setSearchParams({ ...Object.fromEntries(searchParams), page: String(Math.min(guidesData.pagination.pages, page + 1)) });
                  }}
                  disabled={page >= guidesData.pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">No care guides found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareGuides;

