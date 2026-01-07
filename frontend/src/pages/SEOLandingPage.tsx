import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { ChevronRight, Home, CheckCircle, AlertCircle } from 'lucide-react';

interface SEOLandingPageProps {
  keyword: string;
  title: string;
  description: string;
  h1: string;
  introContent: string;
  problemPoints: string[];
  solutionPoints: string[];
  faqItems?: Array<{ question: string; answer: string }>;
  searchTerms: string[];
  petType?: 'dog' | 'cat' | 'other-animals';
  category?: string;
}

/**
 * SEO Landing Page Component
 * Reusable component for creating optimized landing pages for long-tail keywords
 * Dynamically filters products based on search terms and displays relevant content
 */
const SEOLandingPage = ({
  keyword,
  title,
  description,
  h1,
  introContent,
  problemPoints,
  solutionPoints,
  faqItems = [],
  searchTerms,
  petType,
  category
}: SEOLandingPageProps) => {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'rating';

  // Build search query from all search terms
  const searchQuery = searchTerms.join(' ');

  // Fetch products matching the search terms
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'seo-landing', keyword, page, sort, petType, category],
    queryFn: () =>
      productService.getProducts({
        page,
        limit: 20,
        search: searchQuery,
        petType: petType || undefined,
        category: category || undefined,
        sort: sort as any,
        minRating: 4.0 // Show highly rated products
      }),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000
  });

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs = [
      { label: 'Home', path: '/' },
      { label: 'Products', path: '/products' }
    ];
    if (petType) {
      const petTypeDisplay = petType === 'other-animals' 
        ? 'Other Animals' 
        : petType.charAt(0).toUpperCase() + petType.slice(1);
      crumbs.push({ label: petTypeDisplay, path: `/${petType}` });
    }
    crumbs.push({ label: h1, path: '' });
    return crumbs;
  }, [petType, h1]);

  // Generate FAQ schema
  const faqSchema = useMemo(() => {
    if (faqItems.length === 0) return null;
    return {
      '@context': 'https://schema.org/',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }, [faqItems]);

  return (
    <>
      <SEO
        title={title}
        description={description}
        keywords={searchTerms.join(', ')}
        url={`https://www.petshiwu.com/${keyword.replace(/\s+/g, '-').toLowerCase()}`}
        type="website"
      />
      {faqSchema && <StructuredData type="faq" data={faqSchema} />}
      
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.path || index} className="flex items-center">
                {index > 0 && <ChevronRight size={16} className="mx-2 text-gray-400" />}
                {index === 0 ? (
                  <Link to={crumb.path} className="hover:text-primary-600 transition-colors flex items-center gap-1">
                    <Home size={16} />
                    {crumb.label}
                  </Link>
                ) : crumb.path ? (
                  <Link to={crumb.path} className="hover:text-primary-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {h1}
          </h1>
          <div className="prose prose-lg max-w-none text-gray-700 mb-6">
            <p className="text-xl leading-relaxed">{introContent}</p>
          </div>
        </div>

        {/* Problem Section */}
        {problemPoints.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle className="text-red-500 mr-3 mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-red-900 mb-3">
                  Common Problems Pet Owners Face
                </h2>
                <ul className="space-y-2 text-red-800">
                  {problemPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Solution Section */}
        {solutionPoints.length > 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-r-lg">
            <div className="flex items-start">
              <CheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-green-900 mb-3">
                  How We Can Help
                </h2>
                <ul className="space-y-2 text-green-800">
                  {solutionPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Recommended Products
          </h2>
          {isLoading ? (
            <LoadingSpinner size="lg" />
          ) : products && products.data && products.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {products.data.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              {products.pagination && products.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: products.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      to={`?page=${pageNum}`}
                      className={`px-4 py-2 rounded ${
                        page === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No products found matching your criteria.</p>
              <Link
                to="/products"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Browse All Products
              </Link>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        {faqItems.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqItems.map((faq, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    {faq.question}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Still Have Questions?
          </h2>
          <p className="text-gray-700 mb-6">
            Our pet care experts are here to help you find the perfect solution for your pet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Browse All Products
            </Link>
            <Link
              to="/faq"
              className="inline-block bg-white text-primary-600 border-2 border-primary-600 px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors font-semibold"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SEOLandingPage;

