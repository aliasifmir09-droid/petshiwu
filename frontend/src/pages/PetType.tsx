import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Dropdown from '@/components/Dropdown';
import { SlidersHorizontal, ArrowUpDown, ChevronRight, Home, Bell, Sparkles } from 'lucide-react';
import { hasImageFailed } from '@/hooks/useImageLoadTracker';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useSEO } from '@/hooks/useSEO';

const PetType = () => {
  const { petType: petTypeParam } = useParams<{ petType: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Normalize petType to slug format (hyphens) - handles both "small-pet" and "small pet" from URL
  // This ensures consistency with backend expectations
  const petType = petTypeParam ? petTypeParam.toLowerCase().trim().replace(/\s+/g, '-') : '';

  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'newest';
  const brand = searchParams.get('brand') || '';
  const minRating = searchParams.get('minRating') || '';
  const inStock = searchParams.get('inStock') || '';

  // Scroll to top when page changes (pagination)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Fetch all products for this pet type
  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', 'petType', petType, page, sort, brand, minRating, inStock],
    queryFn: () =>
      productService.getProducts({
        page,
        limit: 20,
        petType: petType || undefined,
        sort: sort as any,
        brand: brand || undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        inStock: inStock ? inStock === 'true' : undefined
      }),
    enabled: !!petType,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000
  });

  // Get all products to extract unique brands (for filter options)
  // Get unique brands efficiently using dedicated API endpoint
  const { data: brands = [] } = useQuery({
    queryKey: ['brands', 'petType', petType],
    queryFn: () => productService.getUniqueBrands(undefined, petType),
    enabled: !!petType,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (brands don't change often)
    gcTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
  });

  const updateFilters = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  // Convert slug format to display format (e.g., "small-pet" -> "Small Pet")
  const petTypeDisplay = petType 
    ? petType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  // Generate SEO metadata
  const seoData = useSEO({
    title: `${petTypeDisplay} Products - Premium Pet Supplies`,
    description: `Shop premium ${petTypeDisplay.toLowerCase()} products including food, treats, toys, and accessories. Quality products, fast shipping, great prices at petshiwu.`,
    keywords: [
      `${petTypeDisplay.toLowerCase()} products`,
      `${petTypeDisplay.toLowerCase()} food`,
      `${petTypeDisplay.toLowerCase()} supplies`,
      `${petTypeDisplay.toLowerCase()} accessories`
    ],
    type: 'collection',
    context: { petType },
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: petTypeDisplay, url: `/${petType}` }
    ],
    items: products?.data.slice(0, 20).map((product) => ({
      name: product.name,
      url: `/products/${product.slug}`,
      image: product.images[0]
    })) || []
  });

  if (isError) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12 text-center">
        <p className="text-gray-500 mb-4">Couldn't load products. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={seoData.canonicalUrl}
        type="website"
      />
      {seoData.collectionPageSchema && (
        <StructuredData type="collectionPage" data={seoData.collectionPageSchema} />
      )}
      {seoData.breadcrumbSchema && (
        <StructuredData type="breadcrumb" data={seoData.breadcrumbSchema} />
      )}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumbs */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li className="flex items-center">
            <Link
              to="/"
              className="hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              <Home size={16} />
              Home
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            <span className="font-medium text-gray-900">{petTypeDisplay}</span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{petTypeDisplay} Products</h1>
        {products && (
          <p className="text-gray-600">
            Showing {((page - 1) * (products.pagination.limit || 20)) + 1} - {Math.min(page * (products.pagination.limit || 20), products.pagination.total)} of {products.pagination.total} products
          </p>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal size={20} />
          <span>Filters</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Sort by:</span>
          <Dropdown
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'price-asc', label: 'Price: Low to High' },
              { value: 'price-desc', label: 'Price: High to Low' },
              { value: 'rating', label: 'Highest Rated' }
            ]}
            value={sort}
            onChange={(value) => updateFilters('sort', value)}
            icon={<ArrowUpDown size={16} />}
            size="sm"
          />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 flex-shrink-0 space-y-6">
            {/* Brand Filter */}
            {brands.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Brand</h3>
                <Dropdown
                  options={[
                    { value: '', label: 'All Brands' },
                    ...brands.map((brandName) => ({
                      value: brandName,
                      label: brandName
                    }))
                  ]}
                  value={brand}
                  onChange={(value) => updateFilters('brand', value)}
                  size="sm"
                />
              </div>
            )}

            {/* Rating Filter */}
            <div>
              <h3 className="font-medium mb-3">Minimum Rating</h3>
              <Dropdown
                options={[
                  { value: '', label: 'All Ratings' },
                  { value: '4', label: '4+ Stars' },
                  { value: '3', label: '3+ Stars' },
                  { value: '2', label: '2+ Stars' },
                  { value: '1', label: '1+ Star' }
                ]}
                value={minRating}
                onChange={(value) => updateFilters('minRating', value)}
                size="sm"
              />
            </div>

            {/* Stock Filter */}
            <div>
              <h3 className="font-medium mb-3">Availability</h3>
              <Dropdown
                options={[
                  { value: '', label: 'All Products' },
                  { value: 'true', label: 'In Stock Only' }
                ]}
                value={inStock}
                onChange={(value) => updateFilters('inStock', value)}
                size="sm"
              />
            </div>
          </div>
        )}

        {/* Products */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                  <div className="bg-gray-200 h-52 w-full" />
                  <div className="p-4 space-y-3">
                    <div className="bg-gray-200 h-3 rounded w-1/3" />
                    <div className="bg-gray-200 h-4 rounded w-full" />
                    <div className="bg-gray-200 h-4 rounded w-2/3" />
                    <div className="bg-gray-200 h-8 rounded w-1/2 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products && products.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                {products.data
                  .filter((product) => {
                    const productId = product._id ? String(product._id) : null;
                    return productId && !hasImageFailed(productId);
                  })
                  .map((product) => (
                    <div key={product._id} className="flex">
                      <ProductCard product={product} />
                    </div>
                  ))}
              </div>

              {/* Pagination */}
              {products.pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {page > 1 && (
                    <button
                      onClick={() => updateFilters('page', (page - 1).toString())}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}

                  {Array.from({ length: products.pagination.pages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (products.pagination.pages <= 7) return true;
                      return (
                        p === 1 ||
                        p === products.pagination.pages ||
                        (p >= page - 1 && p <= page + 1)
                      );
                    })
                    .map((p, index, array) => (
                      <div key={p} className="flex items-center gap-2">
                        {index > 0 && array[index - 1] !== p - 1 && (
                          <span className="px-2">...</span>
                        )}
                        <button
                          onClick={() => updateFilters('page', p.toString())}
                          className={`px-4 py-2 border rounded-lg ${
                            page === p
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    ))}

                  {page < products.pagination.pages && (
                    <button
                      onClick={() => updateFilters('page', (page + 1).toString())}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Empty category — show a "Coming Soon" card instead of a bare text line.
               This looks intentional rather than broken, and gives users a clear
               call to action (browse other categories or check back soon). */
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              {/* Pet emoji badge */}
              <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6 shadow-inner">
                <span className="text-5xl select-none" role="img" aria-label={petTypeDisplay}>
                  {petType === 'reptile' ? '🦎'
                    : petType === 'small-pet' ? '🐹'
                    : petType === 'fish' ? '🐟'
                    : petType === 'bird' ? '🐦'
                    : petType === 'cat' ? '🐱'
                    : petType === 'dog' ? '🐕'
                    : '🐾'}
                </span>
              </div>

              {/* Heading */}
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-primary-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {petTypeDisplay} Products Coming Soon
                </h2>
                <Sparkles size={18} className="text-primary-500" />
              </div>

              <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                We're busy curating the best {petTypeDisplay.toLowerCase()} products for your
                furry (or scaly!) family. Check back soon — new arrivals are on their way.
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Browse All Products
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <Home size={16} />
                  Back to Home
                </Link>
              </div>

              {/* Other categories */}
              <div className="mt-10 w-full max-w-lg">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Available categories
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { slug: 'dog', label: '🐕 Dogs' },
                    { slug: 'cat', label: '🐱 Cats' },
                    { slug: 'bird', label: '🐦 Birds' },
                  ]
                    .filter(c => c.slug !== petType)
                    .map(c => (
                      <Link
                        key={c.slug}
                        to={`/${c.slug}`}
                        className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-primary-50 hover:text-primary-700 transition-colors"
                      >
                        {c.label}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default PetType;

