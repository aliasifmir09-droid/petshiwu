import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ProductCard from '@/components/ProductCard';
import { X, Plus, ShoppingCart, Star, Package, TrendingUp, Award } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

const ProductComparison = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { toast, showToast, hideToast } = useToast();

  const productIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  const [comparisonIds, setComparisonIds] = useState<string[]>(productIds);

  const { data: comparison, isLoading, error } = useQuery({
    queryKey: ['productComparison', comparisonIds.join(',')],
    queryFn: () => productService.compareProducts(comparisonIds),
    enabled: comparisonIds.length > 0 && comparisonIds.length <= 5
  });

  const { data: suggestions } = useQuery({
    queryKey: ['comparisonSuggestions', comparisonIds.join(',')],
    queryFn: () => productService.getComparisonSuggestions(comparisonIds),
    enabled: comparisonIds.length > 0 && comparisonIds.length < 5
  });

  useEffect(() => {
    if (comparisonIds.length > 0) {
      setSearchParams({ ids: comparisonIds.join(',') });
    }
  }, [comparisonIds, setSearchParams]);

  const removeProduct = (productId: string) => {
    setComparisonIds(prev => prev.filter(id => id !== productId));
  };

  const addProduct = (productId: string) => {
    if (comparisonIds.length >= 5) {
      showToast('You can compare up to 5 products at once', 'error');
      return;
    }
    if (!comparisonIds.includes(productId)) {
      setComparisonIds(prev => [...prev, productId]);
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart(product, product.variants?.[0]);
    showToast(`${product.name} added to cart`, 'success');
  };

  if (comparisonIds.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">No Products to Compare</h2>
          <p className="text-gray-600 mb-6">
            Add products to compare by clicking "Compare" on product pages
          </p>
          <Link
            to="/products"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message="Failed to load product comparison"
          retry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!comparison || !comparison.products || comparison.products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <X className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Invalid Products</h2>
          <p className="text-gray-600 mb-6">Some products could not be found</p>
          <button
            onClick={() => navigate('/products')}
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const { products, summary } = comparison;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Compare Products</h1>
        {comparisonIds.length < 5 && suggestions && suggestions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Add more:</span>
            {suggestions.slice(0, 3).map((product: any) => (
              <button
                key={product._id}
                onClick={() => addProduct(product._id)}
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
              >
                + {product.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Summary */}
      {summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Quick Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {summary.cheapest && (
              <div>
                <span className="text-gray-600">Cheapest:</span>
                <p className="font-semibold">{summary.cheapest.name}</p>
              </div>
            )}
            {summary.highestRated && (
              <div>
                <span className="text-gray-600">Highest Rated:</span>
                <p className="font-semibold">{summary.highestRated.name}</p>
              </div>
            )}
            {summary.mostReviewed && (
              <div>
                <span className="text-gray-600">Most Reviewed:</span>
                <p className="font-semibold">{summary.mostReviewed.name}</p>
              </div>
            )}
            {summary.bestValue && (
              <div>
                <span className="text-gray-600">Best Value:</span>
                <p className="font-semibold">{summary.bestValue.name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-6 gap-4 p-4 border-b bg-gray-50">
            <div className="font-semibold">Feature</div>
            {products.map((product: any) => (
              <div key={product._id} className="relative">
                <button
                  onClick={() => removeProduct(product._id)}
                  className="absolute top-0 right-0 p-1 hover:bg-gray-200 rounded"
                  aria-label="Remove from comparison"
                >
                  <X size={16} />
                </button>
                <img
                  src={product.images?.[0] || '/placeholder.png'}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded mb-2"
                />
                <h3 className="font-semibold text-sm">{product.name}</h3>
              </div>
            ))}
            {comparisonIds.length < 5 && (
              <div className="flex items-center justify-center">
                <button
                  onClick={() => navigate('/products')}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 text-gray-600 hover:text-primary-600"
                >
                  <Plus size={24} />
                  <span className="text-sm">Add Product</span>
                </button>
              </div>
            )}
          </div>

          {/* Comparison Rows */}
          <div className="divide-y">
            {/* Price */}
            <div className="grid grid-cols-6 gap-4 p-4">
              <div className="font-semibold">Price</div>
              {products.map((product: any) => (
                <div key={product._id}>
                  <span className="text-lg font-bold">${product.basePrice?.toFixed(2)}</span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-gray-500 line-through ml-2">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Rating */}
            <div className="grid grid-cols-6 gap-4 p-4">
              <div className="font-semibold">Rating</div>
              {products.map((product: any) => (
                <div key={product._id} className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{product.averageRating?.toFixed(1) || 'N/A'}</span>
                  <span className="text-sm text-gray-500">
                    ({product.reviewCount || 0} reviews)
                  </span>
                </div>
              ))}
            </div>

            {/* Stock */}
            <div className="grid grid-cols-6 gap-4 p-4">
              <div className="font-semibold">Stock</div>
              {products.map((product: any) => (
                <div key={product._id}>
                  {product.inStock ? (
                    <span className="text-green-600 font-semibold">In Stock</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Out of Stock</span>
                  )}
                </div>
              ))}
            </div>

            {/* Brand */}
            <div className="grid grid-cols-6 gap-4 p-4">
              <div className="font-semibold">Brand</div>
              {products.map((product: any) => (
                <div key={product._id}>{product.brand || 'N/A'}</div>
              ))}
            </div>

            {/* Category */}
            <div className="grid grid-cols-6 gap-4 p-4">
              <div className="font-semibold">Category</div>
              {products.map((product: any) => (
                <div key={product._id} className="text-sm">
                  {product.category?.name || 'N/A'}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50">
              <div className="font-semibold">Actions</div>
              {products.map((product: any) => (
                <div key={product._id} className="space-y-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <ShoppingCart size={16} className="inline mr-1" />
                    Add to Cart
                  </button>
                  <Link
                    to={`/products/${product.slug}`}
                    className="block text-center text-primary-600 hover:text-primary-700 text-sm font-semibold"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

export default ProductComparison;

