import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { comparisonService } from '@/services/comparison';
import { Product } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProductCard from '@/components/ProductCard';
import { X, Plus, CheckCircle, Star, DollarSign, Package, Award } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import EmptyState from '@/components/EmptyState';

const ProductComparison = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const [productIds, setProductIds] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    setProductIds(ids);
  }, [searchParams]);

  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['compare', productIds.join(',')],
    queryFn: () => comparisonService.compareProducts(productIds),
    enabled: productIds.length > 0 && productIds.length <= 5
  });

  const { data: suggestionData } = useQuery({
    queryKey: ['compare-suggestions', productIds.join(',')],
    queryFn: () => comparisonService.getSuggestions(productIds),
    enabled: productIds.length > 0 && productIds.length < 5
  });

  useEffect(() => {
    if (suggestionData?.suggestions) {
      setSuggestions(suggestionData.suggestions);
    }
  }, [suggestionData]);

  const addProduct = (productId: string) => {
    if (productIds.length >= 5) {
      showToast('You can compare up to 5 products', 'warning');
      return;
    }
    if (productIds.includes(productId)) {
      showToast('Product already in comparison', 'warning');
      return;
    }
    const newIds = [...productIds, productId];
    setProductIds(newIds);
    setSearchParams({ ids: newIds.join(',') });
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
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Cheapest</span>
            </div>
            <p className="text-sm text-green-700">
              {products.find(p => p._id === summary.cheapest)?.name || 'N/A'}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Highest Rated</span>
            </div>
            <p className="text-sm text-yellow-700">
              {products.find(p => p._id === summary.highestRated)?.name || 'N/A'}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Most Reviewed</span>
            </div>
            <p className="text-sm text-blue-700">
              {products.find(p => p._id === summary.mostReviewed)?.name || 'N/A'}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">Best Value</span>
            </div>
            <p className="text-sm text-purple-700">
              {products.find(p => p._id === summary.bestValue)?.name || 'N/A'}
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
                    <span>{product.averageRating?.toFixed(1) || 'N/A'}</span>
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
                  {typeof product.category === 'object' ? product.category.name : 'N/A'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && productIds.length < 5 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Add More Products to Compare</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {suggestions.slice(0, 5 - productIds.length).map((product) => (
              <div key={product._id} className="relative">
                <ProductCard product={product} />
                <button
                  onClick={() => addProduct(product._id)}
                  className="absolute top-2 right-2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default ProductComparison;

