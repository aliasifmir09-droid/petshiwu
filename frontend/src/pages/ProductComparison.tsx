import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { comparisonService } from '@/services/comparison';
import { productService } from '@/services/products';
import { Product } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { X, Plus, CheckCircle, Star, DollarSign, Package, Award, Search } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import EmptyState from '@/components/EmptyState';
import { decodeHtmlEntities } from '@/utils/htmlUtils';

const ProductComparison = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const [productIds, setProductIds] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    setProductIds(ids);
  }, [searchParams]);

  // Fetch comparison data when we have 2 products
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['compare', productIds.join(',')],
    queryFn: () => comparisonService.compareProducts(productIds),
    enabled: productIds.length === 2
  });

  // Fetch suggestions when we have 1 product
  const { data: suggestionData } = useQuery({
    queryKey: ['compare-suggestions', productIds[0]],
    queryFn: () => comparisonService.getSuggestions([productIds[0]]),
    enabled: productIds.length === 1
  });

  // Fetch current product when we have 1 product
  const { data: currentProduct } = useQuery({
    queryKey: ['product', productIds[0]],
    queryFn: () => productService.getProduct(productIds[0]),
    enabled: productIds.length === 1 && !!productIds[0]
  });

  useEffect(() => {
    if (suggestionData && Array.isArray(suggestionData)) {
      setSuggestions(suggestionData);
    } else {
      setSuggestions([]);
    }
  }, [suggestionData]);

  // Search for products
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await productService.getProducts({
        search: searchQuery,
        limit: 10
      });
      // Filter out the current product if we have one
      const filtered = response.data.filter(
        (p: Product) => !productIds.includes(String(p._id))
      );
      setSearchResults(filtered);
    } catch (error) {
      showToast('Failed to search products', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const addProduct = (productId: string) => {
    if (productIds.length >= 2) {
      showToast('You can compare up to 2 products', 'warning');
      return;
    }
    if (productIds.includes(productId)) {
      showToast('Product already in comparison', 'warning');
      return;
    }
    const newIds = [...productIds, productId];
    setProductIds(newIds);
    setSearchParams({ ids: newIds.join(',') });
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeProduct = (productId: string) => {
    const newIds = productIds.filter(id => id !== productId);
    setProductIds(newIds);
    if (newIds.length > 0) {
      setSearchParams({ ids: newIds.join(',') });
    } else {
      setSearchParams({});
    }
  };

  // Show empty state if no products
  if (productIds.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Compare Products</h1>
          <EmptyState
            icon={Package}
            title="No Products to Compare"
            description="Add products to compare by clicking the 'Compare' button on product pages."
            action={{
              label: "Browse Products",
              to: "/products"
            }}
          />
        </div>
        {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    );
  }

  // Show search/suggestions when we have 1 product
  if (productIds.length === 1) {

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Compare Products</h1>
            <p className="text-gray-600">Select a second product to compare</p>
          </div>

          {/* Current Product */}
          {currentProduct && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Product to Compare</h2>
                <button
                  onClick={() => removeProduct(productIds[0])}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex gap-4">
                <img
                  src={currentProduct.images?.[0] || '/placeholder.png'}
                  alt={currentProduct.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div>
                  <Link
                    to={`/products/${currentProduct.slug}`}
                    className="font-semibold text-primary-600 hover:text-primary-700"
                  >
                    {currentProduct.name}
                  </Link>
                  <p className="text-lg font-bold mt-1">${currentProduct.basePrice.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search for a Product to Compare
            </h2>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Search Results</h3>
                <p className="text-sm text-gray-600 mb-3">Click on any product below to add it to comparison</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {searchResults.map((product) => (
                    <div
                      key={product._id}
                      className="relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 hover:border-primary-300"
                      onClick={() => addProduct(product._id)}
                    >
                      <div className="p-4">
                        <div className="relative aspect-square mb-3">
                          <img
                            src={product.images?.[0] || '/placeholder.png'}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addProduct(product._id);
                            }}
                            className="absolute top-2 right-2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 shadow-lg z-10"
                            title="Add to comparison"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-gray-800">
                          {product.name}
                        </h3>
                        <p className="text-lg font-bold text-primary-600">
                          ${product.basePrice.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600">
                            {product.averageRating?.toFixed(1) || '0.0'} ({product.totalReviews || 0})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions - Show automatically when we have 1 product */}
          {productIds.length === 1 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Similar Products</h2>
              <p className="text-sm text-gray-600 mb-4">Click on any product below to add it to comparison</p>
              {suggestions.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {suggestions.slice(0, 8).map((product) => (
                    <div
                      key={product._id}
                      className="relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 hover:border-primary-300"
                      onClick={() => addProduct(product._id)}
                    >
                      <div className="p-4">
                        <div className="relative aspect-square mb-3">
                          <img
                            src={product.images?.[0] || '/placeholder.png'}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addProduct(product._id);
                            }}
                            className="absolute top-2 right-2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 shadow-lg z-10"
                            title="Add to comparison"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-gray-800">
                          {product.name}
                        </h3>
                        <p className="text-lg font-bold text-primary-600">
                          ${product.basePrice.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600">
                            {product.averageRating?.toFixed(1) || '0.0'} ({product.totalReviews || 0})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Loading similar products...</p>
                </div>
              )}
            </div>
          )}
        </div>
        {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    );
  }

  // Show comparison when we have 2 products
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <EmptyState
          icon={X}
          title="Error Loading Comparison"
          description="Unable to load product comparison. Please try again."
        />
      </div>
    );
  }

  const { products, summary } = comparisonData;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Compare Products</h1>
        <p className="text-gray-600">Side-by-side comparison of selected products</p>
      </div>

      {/* Summary Cards */}
      {summary && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Cheapest</span>
            </div>
            <p className="text-sm text-green-700 line-clamp-2">
              {(() => {
                const cheapestProduct = products.find(p => {
                  const productId = String(p._id);
                  const summaryId = String(summary.cheapest);
                  return productId === summaryId;
                });
                return cheapestProduct?.name || 'N/A';
              })()}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Highest Rated</span>
            </div>
            <p className="text-sm text-yellow-700 line-clamp-2">
              {(() => {
                const highestRatedProduct = products.find(p => {
                  const productId = String(p._id);
                  const summaryId = String(summary.highestRated);
                  return productId === summaryId;
                });
                return highestRatedProduct?.name || 'N/A';
              })()}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Most Reviewed</span>
            </div>
            <p className="text-sm text-blue-700 line-clamp-2">
              {(() => {
                const mostReviewedProduct = products.find(p => {
                  const productId = String(p._id);
                  const summaryId = String(summary.mostReviewed);
                  return productId === summaryId;
                });
                return mostReviewedProduct?.name || 'N/A';
              })()}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">Best Value</span>
            </div>
            <p className="text-sm text-purple-700 line-clamp-2">
              {(() => {
                const bestValueProduct = products.find(p => {
                  const productId = String(p._id);
                  const summaryId = String(summary.bestValue);
                  return productId === summaryId;
                });
                return bestValueProduct?.name || 'N/A';
              })()}
            </p>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Feature</th>
              {products.map((product) => (
                <th key={product._id} className="p-4 text-center min-w-[200px]">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => removeProduct(product._id)}
                      className="ml-auto mb-2 text-gray-400 hover:text-red-500"
                    >
                      <X size={20} />
                    </button>
                    <img
                      src={product.images?.[0] || '/placeholder.png'}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded mb-2"
                    />
                    <Link
                      to={`/products/${product.slug}`}
                      className="font-semibold text-primary-600 hover:text-primary-700"
                    >
                      {product.name}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-4 font-semibold">Price</td>
              {products.map((product) => (
                <td key={product._id} className="p-4 text-center">
                  <span className="text-lg font-bold">${product.basePrice.toFixed(2)}</span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-gray-500 line-through ml-2">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-4 font-semibold">Rating</td>
              {products.map((product) => (
                <td key={product._id} className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span>{product.averageRating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-500 text-sm">
                      ({product.totalReviews || 0} reviews)
                    </span>
                  </div>
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-4 font-semibold">Stock</td>
              {products.map((product) => (
                <td key={product._id} className="p-4 text-center">
                  <span className={product.inStock ? 'text-green-600' : 'text-red-600'}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-4 font-semibold">Brand</td>
              {products.map((product) => (
                <td key={product._id} className="p-4 text-center">
                  {product.brand || 'N/A'}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-4 font-semibold">Category</td>
              {products.map((product) => (
                <td key={product._id} className="p-4 text-center">
                  {typeof product.category === 'object' ? decodeHtmlEntities(product.category.name) : 'N/A'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default ProductComparison;
