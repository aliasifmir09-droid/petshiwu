import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/ProductCard';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { trackSearch } from '@/utils/analytics';
import { useDebounce } from '@/hooks/useDebounce';

const AdvancedSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    inStock: searchParams.get('inStock') === 'true',
    category: searchParams.get('category') || '',
    petType: searchParams.get('petType') || '',
    brand: searchParams.get('brand') || '',
    sort: searchParams.get('sort') || 'newest'
  });

  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const debouncedAutocompleteQuery = useDebounce(autocompleteQuery, 300); // Debounce autocomplete by 300ms
  const [autocompleteResults, setAutocompleteResults] = useState<Array<{ type: string; name: string; slug: string; image?: string }>>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', query, filters],
    queryFn: () => productService.search(query, {
      ...(filters.minPrice && { minPrice: parseFloat(filters.minPrice) }),
      ...(filters.maxPrice && { maxPrice: parseFloat(filters.maxPrice) }),
      ...(filters.minRating && { minRating: parseFloat(filters.minRating) }),
      ...(filters.inStock && { inStock: true }),
      ...(filters.category && { category: filters.category }),
      ...(filters.petType && { petType: filters.petType }),
      ...(filters.brand && { brand: filters.brand }),
      sort: filters.sort,
      page: 1,
      limit: 20
    }),
    enabled: query.length > 0
  });

  useEffect(() => {
    if (debouncedAutocompleteQuery.length > 2) {
      productService.searchAutocomplete(debouncedAutocompleteQuery, 10).then(setAutocompleteResults);
    } else {
      setAutocompleteResults([]);
    }
  }, [debouncedAutocompleteQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      showToast('Please enter a search query', 'warning');
      return;
    }
    
    // Track search
    trackSearch(query, searchResults?.pagination?.total);
    
    const params = new URLSearchParams();
    params.set('q', query);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      minRating: '',
      inStock: false,
      category: '',
      petType: '',
      brand: '',
      sort: 'newest'
    });
    setSearchParams({ q: query });
  };

  const handleAutocompleteSelect = (item: { type: string; slug: string }) => {
    if (item.type === 'product') {
      navigate(`/products/${item.slug}`);
    } else if (item.type === 'category') {
      navigate(`/category/${item.slug}`);
    }
    setShowAutocomplete(false);
    setAutocompleteQuery('');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Advanced Search</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setAutocompleteQuery(e.target.value);
                setShowAutocomplete(e.target.value.length > 2);
              }}
              onFocus={() => setShowAutocomplete(autocompleteQuery.length > 2)}
              placeholder="Search for products..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {showAutocomplete && autocompleteResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {autocompleteResults.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleAutocompleteSelect(item)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                  >
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300"
          >
            <SlidersHorizontal size={20} />
          </button>
        </form>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Min Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Any</option>
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
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">In Stock Only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : searchResults && searchResults.data && searchResults.data.length > 0 ? (
        <>
          <div className="mb-4 text-gray-600">
            Found {searchResults.pagination?.total || searchResults.data.length} results
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.data.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </>
      ) : query ? (
        <EmptyState
          icon={Search}
          title="No Results Found"
          description="Try adjusting your search terms or filters."
        />
      ) : null}

      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default AdvancedSearch;

