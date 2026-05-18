import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import { Search, X, SlidersHorizontal, ArrowLeft, Package, Camera, Loader2, ImageIcon } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import SEO from '@/components/SEO';
import { normalizeImageUrl } from '@/utils/imageUtils';
import api from '@/services/api';

const AdvancedSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Visual search state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [visualResults, setVisualResults] = useState<any>(null);

  const visualSearchMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise<any>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const dataUrl = e.target?.result as string;
            const res = await api.post('/products/visual-search', {
              image: dataUrl,
              mimeType: file.type,
            });
            resolve(res.data);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (data) => {
      setVisualResults(data);
      setInputValue('');
    },
  });

  // Compress image to max 800px wide, 70% JPEG quality before sending
  // Phone photos can be 4-8MB; this brings them under 200KB for reliable upload
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 800;
        const scale = img.width > MAX ? MAX / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.72
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setVisualResults(null);
    // Compress before sending to avoid payload size errors on mobile
    const compressed = await compressImage(file);
    visualSearchMutation.mutate(compressed);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setVisualResults(null);
    visualSearchMutation.reset();
  };

  // Close photo menu when clicking outside
  useEffect(() => {
    if (!showPhotoMenu) return;
    const close = () => setShowPhotoMenu(false);
    document.addEventListener('click', close, { capture: true, once: true });
    return () => document.removeEventListener('click', close, { capture: true });
  }, [showPhotoMenu]);
  const [filters, setFilters] = useState({
    sort: searchParams.get('sort') || 'newest',
    inStock: searchParams.get('inStock') === 'true',
    petType: searchParams.get('petType') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  });

  // Debounce the search query — search fires 350ms after user stops typing
  const debouncedQuery = useDebounce(inputValue.trim(), 350);

  // Auto-focus on mount (mobile keyboard opens immediately)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Sync URL when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      const params = new URLSearchParams();
      params.set('q', debouncedQuery);
      if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
      if (filters.inStock) params.set('inStock', 'true');
      if (filters.petType) params.set('petType', filters.petType);
      if (filters.brand) params.set('brand', filters.brand);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      setSearchParams(params);
    } else {
      setSearchParams({});
    }
  }, [debouncedQuery, filters]);

  // Fetch results — fires automatically when debouncedQuery changes
  const { data: searchResults, isLoading, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery, filters],
    queryFn: () =>
      productService.search(debouncedQuery, {
        sort: filters.sort,
        inStock: filters.inStock || undefined,
        petType: filters.petType || undefined,
        brand: filters.brand || undefined,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        page: 1,
        limit: 24,
      }),
    enabled: debouncedQuery.length >= 1,
    staleTime: 30 * 1000,
  });

  const products = searchResults?.data || [];
  const total = searchResults?.pagination?.total || 0;
  const isSearching = isLoading || isFetching;

  // Suggestions from autocomplete (shown while typing, before results)
  const { data: suggestions } = useQuery({
    queryKey: ['search-autocomplete', inputValue],
    queryFn: () => productService.getSearchSuggestions(inputValue, 6),
    enabled: inputValue.length >= 2 && products.length === 0 && !isSearching,
    staleTime: 30 * 1000,
  });
  const suggestionProducts = suggestions?.data?.products || [];

  return (
    <>
      <SEO
        title={debouncedQuery ? `"${debouncedQuery}" - Search Results` : 'Search Products'}
        description="Search for pet food, toys, accessories and supplies."
        keywords={['pet products', 'search', debouncedQuery].filter(Boolean)}
        url={`https://www.petshiwu.com/search`}
      />

      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">

        {/* ── Sticky Search Header ── */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            {/* Back arrow on mobile */}
            <button
              onClick={() => navigate(-1)}
              className="lg:hidden flex-shrink-0 p-2 -ml-1 text-gray-600 hover:text-gray-900"
              aria-label="Go back"
            >
              <ArrowLeft size={22} />
            </button>

            {/* Search input */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search products, brands..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {inputValue && (
                <button
                  onClick={() => setInputValue('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Camera / photo search button with source menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setShowPhotoMenu(prev => !prev); }}
                className={`p-2.5 rounded-xl border-2 transition-all ${
                  photoPreview || showPhotoMenu
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-400'
                }`}
                aria-label="Search by photo"
                title="Search by photo"
              >
                <Camera size={18} />
              </button>

              {/* Dropdown — take photo or choose from library */}
              {showPhotoMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">
                    Search by photo
                  </p>
                  {/* Take Photo — opens camera */}
                  <button
                    onClick={() => { setShowPhotoMenu(false); cameraInputRef.current?.click(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Camera size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Take a Photo</p>
                      <p className="text-xs text-gray-400">Open camera</p>
                    </div>
                  </button>
                  {/* Choose from Library */}
                  <button
                    onClick={() => { setShowPhotoMenu(false); galleryInputRef.current?.click(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors border-t border-gray-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Photo Library</p>
                      <p className="text-xs text-gray-400">Choose from gallery</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Camera input — opens rear camera directly */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              {/* Gallery input — opens photo library */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-shrink-0 p-2.5 rounded-xl border-2 transition-all ${
                showFilters ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600'
              }`}
              aria-label="Filters"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 max-w-3xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {/* Sort */}
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="featured">Featured</option>
                </select>

                {/* Pet type */}
                <select
                  value={filters.petType}
                  onChange={(e) => setFilters({ ...filters, petType: e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Pets</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="fish">Fish</option>
                  <option value="small-animal">Small Animal</option>
                </select>

                {/* In stock toggle */}
                <button
                  onClick={() => setFilters({ ...filters, inStock: !filters.inStock })}
                  className={`text-sm px-3 py-1.5 rounded-lg border-2 transition-all ${
                    filters.inStock
                      ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  In Stock Only
                </button>

                {/* Price range */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    placeholder="Min $"
                    className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-sm">–</span>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    placeholder="Max $"
                    className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Clear filters */}
                {(filters.petType || filters.inStock || filters.minPrice || filters.maxPrice || filters.sort !== 'newest') && (
                  <button
                    onClick={() => setFilters({ sort: 'newest', inStock: false, petType: '', brand: '', minPrice: '', maxPrice: '' })}
                    className="text-sm text-red-500 hover:text-red-600 px-2 py-1.5"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Photo Search Panel ── */}
        {photoPreview && (
          <div className="max-w-3xl mx-auto px-4 pt-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start gap-4">
                {/* Preview image */}
                <div className="relative flex-shrink-0">
                  <img
                    src={photoPreview}
                    alt="Your photo"
                    className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                  />
                  <button
                    onClick={clearPhoto}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Status */}
                <div className="flex-1 min-w-0">
                  {visualSearchMutation.isPending && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-sm font-medium">Analyzing your photo with AI...</span>
                    </div>
                  )}
                  {visualSearchMutation.isError && (
                    <p className="text-sm text-red-500">
                      Something went wrong. Please try again.
                    </p>
                  )}
                  {visualResults?.identified && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ImageIcon size={15} className="text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">AI identified</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 capitalize">{visualResults.identified.productType}</p>
                      {visualResults.identified.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{visualResults.identified.description}</p>
                      )}
                    </div>
                  )}
                  {visualResults?.message && !visualResults?.identified && (
                    <p className="text-sm text-gray-600">{visualResults.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="max-w-3xl mx-auto px-4 pt-4">

          {/* Visual search results */}
          {visualResults?.data?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-semibold text-gray-900">{visualResults.data.length}</span> products matching your photo
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {visualResults.data.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state — no query yet */}
          {!inputValue && !photoPreview && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={28} className="text-blue-600" />
              </div>
              <p className="text-lg font-semibold text-gray-800">Search for anything</p>
              <p className="text-sm text-gray-500 mt-1">Dog food, cat toys, leashes, beds...</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium hover:bg-blue-100 transition-all"
                >
                  <Camera size={15} />
                  Take Photo
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-sm text-purple-700 font-medium hover:bg-purple-100 transition-all"
                >
                  <ImageIcon size={15} />
                  From Gallery
                </button>
              </div>

              {/* Quick searches */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['Dog food', 'Cat litter', 'Dog toys', 'Cat treats', 'Bird food', 'Fish tank'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setInputValue(term)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Searching indicator */}
          {inputValue && !photoPreview && isSearching && (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {/* Text search results */}
          {!photoPreview && !isSearching && debouncedQuery && products.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> results for
                  {' '}<span className="font-semibold text-blue-600">"{debouncedQuery}"</span>
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product: any) => (
                  <ProductCard key={product._id} product={product} searchTerm={debouncedQuery} />
                ))}
              </div>
            </>
          )}

          {/* No results */}
          {!photoPreview && !isSearching && debouncedQuery && products.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={28} className="text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-800">No results for "{debouncedQuery}"</p>
              <p className="text-sm text-gray-500 mt-1 mb-6">Try a shorter or different search term</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Dog food', 'Cat litter', 'Pet toys', 'Treats'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setInputValue(term)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Autocomplete suggestions (while typing, before debounce fires) */}
          {inputValue.length >= 2 && !debouncedQuery && suggestionProducts.length > 0 && (
            <div className="space-y-1">
              {suggestionProducts.map((p: any) => (
                <Link
                  key={p._id || p.slug}
                  to={`/products/${p.slug}`}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {p.images?.[0] ? (
                      <img src={normalizeImageUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={18} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    {p.basePrice && (
                      <p className="text-sm font-bold text-blue-600">${p.basePrice.toFixed(2)}</p>
                    )}
                  </div>
                  <Search size={15} className="text-gray-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default AdvancedSearch;
