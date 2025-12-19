import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { careGuideService } from '@/services/careGuides';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Clock, Eye, BookOpen, Calendar, User, Tag, TrendingUp, TrendingDown, Minus, ArrowLeft } from 'lucide-react';
import { normalizeImageUrl } from '@/utils/imageUtils';
import DOMPurify from 'dompurify';
import SEO from '@/components/SEO';
import ProductCard from '@/components/ProductCard';

const CareGuideDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: guide, isLoading, error } = useQuery({
    queryKey: ['care-guide', slug],
    queryFn: () => careGuideService.getCareGuideBySlug(slug!),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000
  });

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return <TrendingDown size={20} className="text-green-600" />;
      case 'intermediate':
        return <Minus size={20} className="text-yellow-600" />;
      case 'advanced':
        return <TrendingUp size={20} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Care Guide Not Found</h1>
        <p className="text-gray-600 mb-4">The care guide you're looking for doesn't exist.</p>
        <Link
          to="/care-guides"
          className="text-primary-600 hover:text-primary-700"
        >
          Browse All Care Guides
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={guide.metaTitle || guide.title}
        description={guide.metaDescription || guide.excerpt || guide.title}
      />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 lg:px-8 py-6">
            <Link
              to="/care-guides"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft size={20} />
              <span>Back to Care Guides</span>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={32} className="text-primary-600" />
              <h1 className="text-4xl font-bold">{guide.title}</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Featured Image */}
              {guide.featuredImage && (
                <div className="mb-8 rounded-lg overflow-hidden">
                  <img
                    src={normalizeImageUrl(guide.featuredImage)}
                    alt={guide.title}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>
                    {guide.publishedAt
                      ? new Date(guide.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Not published'}
                  </span>
                </div>
                {guide.readingTime && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{guide.readingTime} min read</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  <span>{guide.views} views</span>
                </div>
                {guide.author && (
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{guide.author.name || guide.author.email}</span>
                  </div>
                )}
              </div>

              {/* Difficulty and Category Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(guide.difficulty)} flex items-center gap-1`}>
                  {getDifficultyIcon(guide.difficulty)}
                  <span className="capitalize">{guide.difficulty || 'General'}</span>
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                  {guide.category}
                </span>
                {guide.petType && guide.petType !== 'all' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300 capitalize">
                    {guide.petType}
                  </span>
                )}
              </div>

              {/* Tags */}
              {guide.tags && guide.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <Tag size={16} className="text-gray-400 mt-1" />
                  {guide.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Excerpt */}
              {guide.excerpt && (
                <div className="bg-blue-50 border-l-4 border-primary-600 p-4 mb-8">
                  <p className="text-gray-700 italic">{guide.excerpt}</p>
                </div>
              )}

              {/* Content */}
              <div className="prose max-w-none mb-8">
                {guide.sections && guide.sections.length > 0 ? (
                  <div className="space-y-8">
                    {guide.sections
                      .sort((a, b) => a.order - b.order)
                      .map((section, index) => (
                        <div key={index} className="border-b pb-6 last:border-b-0">
                          <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                          <div
                            className="text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(section.content)
                            }}
                          />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(guide.content)
                    }}
                  />
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h3 className="text-lg font-bold mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{guide.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Difficulty:</span>
                    <span className="ml-2 capitalize text-gray-600">{guide.difficulty || 'General'}</span>
                  </div>
                  {guide.readingTime && (
                    <div>
                      <span className="font-medium text-gray-700">Reading Time:</span>
                      <span className="ml-2 text-gray-600">{guide.readingTime} minutes</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Views:</span>
                    <span className="ml-2 text-gray-600">{guide.views}</span>
                  </div>
                </div>

                {/* Related Products */}
                {guide.relatedProducts && guide.relatedProducts.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4">Related Products</h3>
                    <div className="space-y-4">
                      {guide.relatedProducts.map((product) => (
                        <ProductCard key={product._id} product={product as any} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CareGuideDetail;

