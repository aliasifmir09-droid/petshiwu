import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import { Search, X, SlidersHorizontal, Star, DollarSign } from 'lucide-react';

const AdvancedSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
    inStock: searchParams.get('inStock') === 'true',
    category: searchParams.get('category') || '',
    petType: searchParams.get('petType') || '',
    brand: searchParams.get('brand') || '',
    sort: searchParams.get('sort') || 'relevance'
  });

  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const { data: autocompleteResults } = useQuery({
    queryKey: ['searchAutocomplete', autocompleteQuery],
    queryFn: () => productService.searchAutocomplete(autocompleteQuery),
    enabled: autocompleteQuery.length > 2 && showAutocomplete
  });

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['advancedSearch', query, filters],
    queryFn: () => productService.advancedSearch(query, {
      ...filters,
      page: 1,
      limit: 20
    }),
    enabled: query.length > 0
  });

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.minRating) params.set('minRating', filters.minRating.toString());
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.category) params.set('category', filters.category);
    if (filters.petType) params.set('petType', filters.petType);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.sort) params.set('sort', filters.sort);
    
    setSearchParams(params);
    setShowAutocomplete(false);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      inStock: false,
      category: '',
      petType: '',
      brand: '',
      sort: 'relevance'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setAutocompleteQuery(e.target.value);
              setShowAutocomplete(e.target.value.length > 2);
            }}
            onFocus={() => setShowAutocomplete(searchQuery.length > 2)}
            placeholder="Search for products..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-primary-600"
          >
            <Search size={20} />
          </button>

          {/* Autocomplete Dropdown */}
          {showAutocomplete && autocompleteResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {autocompleteResults.products?.length > 0 && (
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-500 px-2 py-1">Products</p>
                  {autocompleteResults.products.map((product: any) => (
                    <button
                      key={product._id}
                      onClick={() => {
                        setSearchQuery(product.name);
                        setShowAutocomplete(false);
                        navigate(`/products/${product.slug}`);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-3"
                    >
                      <img
                        src={product.images?.[0] || '/placeholder.png'}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <span className="text-sm">{product.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {autocompleteResults.categories?.length > 0 && (
                <div className="p-2 border-t">
                  <p className="text-xs font-semibold text-gray-500 px-2 py-1">Categories</p>
                  {autocompleteResults.categories.map((category: any) => (
                    <button
                      key={category._id}
                      onClick={() => {
                        setSearchQuery(category.name);
                        setShowAutocomplete(false);
                        navigate(`/category/${category.slug}`);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded text-sm"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <SlidersHorizontal size={20} />
            Filters
          </button>
          {query && (
            <p className="text-sm text-gray-600">
              {searchResults?.total || 0} results found
            </p>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Minimum Rating</label>
              <select
                value={filters.minRating || ''}
                onChange={(e) => handleFilterChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Star</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">In Stock Only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {!query && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Start Your Search</h2>
          <p className="text-gray-600">Enter a search term to find products</p>
        </div>
      )}

      {query && isLoading && (
        <div className="py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {query && error && (
        <ErrorMessage
          message="Failed to load search results"
          retry={() => window.location.reload()}
        />
      )}

      {query && searchResults && searchResults.data && (
        <>
          {searchResults.data.length === 0 ? (
            <EmptyState
              icon={<Search className="w-16 h-16" />}
              title="No Results Found"
              description={`We couldn't find any products matching "${query}"`}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.data.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdvancedSearch;

