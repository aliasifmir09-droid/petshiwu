import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Dropdown from '@/components/Dropdown';
import { SlidersHorizontal, ArrowUpDown, ChevronRight, Home } from 'lucide-react';

const PetType = () => {
  const { petType } = useParams<{ petType: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'newest';
  const brand = searchParams.get('brand') || '';
  const minRating = searchParams.get('minRating') || '';
  const inStock = searchParams.get('inStock') || '';

  // Fetch all products for this pet type
  const { data: products, isLoading } = useQuery({
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
    retry: 1,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    gcTime: 5 * 60 * 1000 // Cache for 5 minutes
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

  const petTypeDisplay = petType ? petType.charAt(0).toUpperCase() + petType.slice(1) : '';

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
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
            Showing {products.data.length} of {products.pagination.total} products
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
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No products found for {petTypeDisplay}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetType;

