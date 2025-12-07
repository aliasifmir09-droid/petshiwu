import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { productService } from '@/services/products';
import { categoryService } from '@/services/categories';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import Dropdown from '@/components/Dropdown';
import { SlidersHorizontal, Layers, ArrowUpDown, Star, Package, Tag, Search } from 'lucide-react';
import { trackFilterProducts } from '@/utils/analytics';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const hasScrolledRef = useRef(false);

  const page = parseInt(searchParams.get('page') || '1');
  const petType = searchParams.get('petType') || '';
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const featured = searchParams.get('featured') === 'true';
  const minRating = searchParams.get('minRating') || '';
  const brand = searchParams.get('brand') || '';
  const inStock = searchParams.get('inStock') || '';

  // Scroll to top immediately when navigating to this page
  useEffect(() => {
    // Scroll immediately on component mount and route changes
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Also use setTimeout as a fallback to ensure scroll happens after render
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search]); // Trigger on route or query change

  // Scroll to top smoothly when filters change (within same page)
  useEffect(() => {
    // Small delay to ensure smooth scroll works properly
    const timeoutId = setTimeout(() => {
      if (hasScrolledRef.current) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        hasScrolledRef.current = true;
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [page, petType, category, search, sort, featured, minRating, brand, inStock]);

  // Redirect to category page if category query parameter exists
  useEffect(() => {
    if (!category) return;
    
    let cancelled = false;
    
    // Fetch category to get slug, then redirect
    categoryService.getCategory(category).then((cat) => {
      if (cancelled) return;
      if (cat && cat.slug) {
        navigate(`/category/${cat.slug}`, { replace: true });
      }
    }).catch(() => {
      if (cancelled) return;
      // If category not found, remove category param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('category');
      setSearchParams(newParams, { replace: true });
    });
    
    return () => {
      cancelled = true;
    };
  }, [category, navigate, searchParams, setSearchParams]);

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['products', page, petType, category, search, sort, featured, minRating, brand, inStock],
    queryFn: () =>
      productService.getProducts({
        page,
        limit: 20,
        petType: petType || undefined,
        category: undefined, // Don't filter by category here - redirect instead
        search: search || undefined,
        sort: sort as any,
        featured: featured || undefined,
        minPrice: undefined,
        maxPrice: undefined,
        brand: brand || undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        inStock: inStock ? inStock === 'true' : undefined
      }),
    enabled: !category, // Don't fetch if category param exists (will redirect)
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    gcTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', petType],
    queryFn: () => categoryService.getCategories(petType || undefined)
  });

  // Get all products to extract unique brands (for filter options)
  // Get unique brands efficiently using dedicated API endpoint
  const { data: brands = [] } = useQuery({
    queryKey: ['brands', petType],
    queryFn: () => productService.getUniqueBrands(undefined, petType || undefined),
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
    // Only reset to page 1 if changing filters (not when changing page number)
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {featured
            ? 'Featured Products'
            : search
            ? `Search Results for "${search}"`
            : petType
            ? `${petType.charAt(0).toUpperCase() + petType.slice(1)} Products`
            : 'All Products'}
        </h1>
        {products && (
          <p className="text-gray-600">
            Showing {products.data.length} of {products.pagination.total} products
          </p>
        )}
      </div>

      {/* Active Filters Display */}
      {(petType || category || brand || minRating || inStock || search) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Active Filters:</span>
          {petType && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Pet: {petType}
              <button
                onClick={() => updateFilters('petType', '')}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          {category && categories?.find((c) => c._id === category) && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Category: {categories.find((c) => c._id === category)?.name}
              <button
                onClick={() => updateFilters('category', '')}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          {brand && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Brand: {brand}
              <button
                onClick={() => updateFilters('brand', '')}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          {minRating && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Rating: {minRating}+ Stars
              <button
                onClick={() => updateFilters('minRating', '')}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          {inStock && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              {inStock === 'true' ? 'In Stock' : 'Out of Stock'}
              <button
                onClick={() => updateFilters('inStock', '')}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Search: "{search}"
              <button
                onClick={() => updateFilters('search', '')}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => setSearchParams({})}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium underline"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
          <div className="bg-white rounded-lg shadow p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Filters</h2>

            {/* Pet Type */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Pet Type</h3>
              <Dropdown
                options={[
                  { value: '', label: 'All Pets' },
                  { value: 'dog', label: 'Dogs', description: 'Products for dogs' },
                  { value: 'cat', label: 'Cats', description: 'Products for cats' },
                  { value: 'bird', label: 'Birds', description: 'Products for birds' },
                  { value: 'fish', label: 'Fish', description: 'Products for fish' },
                  { value: 'small-pet', label: 'Small Pets', description: 'Rabbits, hamsters, etc.' },
                  { value: 'reptile', label: 'Reptiles', description: 'Snakes, lizards, etc.' }
                ]}
                value={petType}
                onChange={(value) => updateFilters('petType', value)}
                icon={<Layers size={16} />}
                size="sm"
              />
            </div>

            {/* Category - Removed to force navigation to category pages */}

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="mb-6">
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
                  icon={<Tag size={16} />}
                  size="sm"
                />
              </div>
            )}

            {/* Rating Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Minimum Rating</h3>
              <Dropdown
                options={[
                  { value: '', label: 'Any Rating' },
                  { value: '5', label: '5 Stars', description: '★★★★★ Perfect rating' },
                  { value: '4', label: '4+ Stars', description: '★★★★☆ and above' },
                  { value: '3', label: '3+ Stars', description: '★★★☆☆ and above' },
                  { value: '2', label: '2+ Stars', description: '★★☆☆☆ and above' },
                  { value: '1', label: '1+ Stars', description: '★☆☆☆☆ and above' }
                ]}
                value={minRating}
                onChange={(value) => updateFilters('minRating', value)}
                icon={<Star size={16} />}
                size="sm"
              />
            </div>

            {/* Stock Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Availability</h3>
              <Dropdown
                options={[
                  { value: '', label: 'All Products' },
                  { value: 'true', label: 'In Stock', description: 'Available now' },
                  { value: 'false', label: 'Out of Stock', description: 'Currently unavailable' }
                ]}
                value={inStock}
                onChange={(value) => updateFilters('inStock', value)}
                icon={<Package size={16} />}
                size="sm"
              />
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => setSearchParams({})}
              className="w-full text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Clear All Filters
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <SlidersHorizontal size={20} />
              Filters
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
              <Dropdown
                options={[
                  { value: 'newest', label: 'Newest First', description: 'Latest products' },
                  { value: 'price-asc', label: 'Price: Low to High', description: 'Cheapest first' },
                  { value: 'price-desc', label: 'Price: High to Low', description: 'Most expensive first' },
                  { value: 'rating', label: 'Highest Rated', description: 'Best reviews first' }
                ]}
                value={sort}
                onChange={(value) => updateFilters('sort', value)}
                icon={<ArrowUpDown size={16} />}
                size="sm"
                className="min-w-[180px]"
              />
            </div>
          </div>

          {/* Products */}
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : products && products.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                {products.data.map((product) => (
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
                    .filter(p => p === 1 || p === products.pagination.pages || Math.abs(p - page) <= 2)
                    .map((p, index, array) => (
                      <>
                        {index > 0 && array[index - 1] !== p - 1 && (
                          <span className="px-2 py-2">...</span>
                        )}
                        <button
                          key={p}
                          onClick={() => updateFilters('page', p.toString())}
                          className={`px-4 py-2 rounded-lg ${
                            p === page
                              ? 'bg-primary-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      </>
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
          ) : error ? (
            <ErrorMessage
              title="Failed to load products"
              message="We couldn't load the products. Please try again."
              onRetry={() => refetch()}
              details={error instanceof Error ? error.message : undefined}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No Products Found"
              description={
                search || petType || category || brand || minRating || inStock
                  ? "We couldn't find any products matching your filters. Try adjusting your search criteria."
                  : "No products are available at the moment. Check back soon!"
              }
              action={{
                label: search || petType || category || brand || minRating || inStock ? "Clear Filters" : "Browse All Products",
                to: "/products",
                onClick: () => setSearchParams({})
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;



