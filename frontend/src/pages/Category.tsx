import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import { categoryService } from '@/services/categories';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Dropdown from '@/components/Dropdown';
import { SlidersHorizontal, ArrowUpDown, ChevronRight, Home } from 'lucide-react';

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'newest';
  const brand = searchParams.get('brand') || '';
  const minRating = searchParams.get('minRating') || '';
  const inStock = searchParams.get('inStock') || '';
  const petType = searchParams.get('petType') || '';

  // Fetch category by slug (with petType filter if provided)
  const { data: category, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category', slug, petType],
    queryFn: () => categoryService.getCategory(slug!, petType || undefined),
    enabled: !!slug,
    retry: 1
  });

  // Fetch products for this category - always show products, filtered by category and petType
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'category', category?._id, category?.petType, page, sort, brand, minRating, inStock],
    queryFn: () =>
      productService.getProducts({
        page,
        limit: 20,
        category: category?._id || undefined, // Use category ID
        petType: category?.petType || undefined, // Also filter by petType
        sort: sort as any,
        brand: brand || undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        inStock: inStock ? inStock === 'true' : undefined
      }),
    enabled: !!category // Only fetch products when category is loaded
  });

  // Get all products to extract unique brands (for filter options)
  const { data: allProductsForBrands } = useQuery({
    queryKey: ['products-brands', category?._id],
    queryFn: () => productService.getProducts({ 
      limit: 1000,
      category: category?._id || undefined // Only use category ID
    }),
    enabled: !!category, // Only fetch when category is loaded
    staleTime: 5 * 60 * 1000
  });

  // Extract unique brands from products
  const brands = allProductsForBrands?.data
    ? Array.from(new Set(allProductsForBrands.data.map((p) => p.brand).filter(Boolean)))
        .sort()
    : [];

  // Build breadcrumbs
  const buildBreadcrumbs = () => {
    const crumbs = [
      { label: 'Home', path: '/' }
    ];

    if (category) {
      // Add pet type if available
      if (category.petType && category.petType !== 'all') {
        const petTypeDisplay = category.petType.charAt(0).toUpperCase() + category.petType.slice(1);
        crumbs.push({
          label: petTypeDisplay,
          path: `/${category.petType}`
        });
      }
      
      // Add parent category if it exists
      if (category.parentCategory && typeof category.parentCategory === 'object') {
        crumbs.push({
          label: category.parentCategory.name,
          path: `/category/${category.parentCategory.slug}`
        });
      }
      
      // Add current category
      crumbs.push({
        label: category.name,
        path: `/category/${category.slug}`
      });
    } else if (slug) {
      // Fallback if category not loaded yet
      crumbs.push({
        label: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        path: `/category/${slug}`
      });
    }

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

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

  // Don't show products if category is not loaded - wait for category to load first
  if (!category && !isLoadingCategory) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">
            The category "{slug?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}" doesn't exist.
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  // Show loading if category is still loading
  if (isLoadingCategory || !category) {
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
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.path} className="flex items-center">
              {index > 0 && <ChevronRight size={16} className="mx-2 text-gray-400" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-gray-900">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-primary-600 transition-colors flex items-center gap-1"
                >
                  {index === 0 && <Home size={16} />}
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 mb-4">{category.description}</p>
        )}
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
              {isLoadingProducts ? (
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
                  <p className="text-gray-600 text-lg">No products found in this category.</p>
                </div>
              )}
            </div>
          </div>
    </div>
  );
};

export default Category;

