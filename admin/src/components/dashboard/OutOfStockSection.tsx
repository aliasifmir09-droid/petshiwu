import { useState, memo, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink, Package, Download, ArrowUpDown, Search, ChevronRight } from 'lucide-react';
import { normalizeImageUrl, getPlaceholderImage } from '@/utils/imageUtils';
import { UI } from '@/utils/dashboardConstants';
import { Product, OutOfStockData } from '@/pages/Dashboard';
import { exportOutOfStockProducts } from '@/utils/exportUtils';
import ErrorMessage from '@/components/ErrorMessage';

interface OutOfStockSectionProps {
  outOfStockData: OutOfStockData | undefined;
  outOfStockLoading: boolean;
  outOfStockError: Error | null;
  onExportSuccess: (message: string) => void;
}

const OutOfStockSection = memo(({
  outOfStockData,
  outOfStockLoading,
  outOfStockError,
  onExportSuccess,
}: OutOfStockSectionProps) => {
  const [sortBy, setSortBy] = useState<'name' | 'brand' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  // PERFORMANCE FIX: Add pagination for out-of-stock products
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = UI.OUT_OF_STOCK_DISPLAY_LIMIT;

  // Helper function to safely convert any ID to a unique string key
  const getUniqueKey = (id: string | number | undefined | null | { toString?: () => string; valueOf?: () => unknown }, index: number, prefix: string = 'item'): string => {
    if (id === null || id === undefined) {
      return `${prefix}-${index}`;
    }
    if (typeof id === 'string') {
      return `${id}-${index}`;
    }
    if (typeof id === 'number') {
      return `${id}-${index}`;
    }
    if (typeof id === 'object' && id !== null) {
      if (id.toString && typeof id.toString === 'function') {
        try {
          const str = id.toString();
          if (str && str !== '[object Object]') {
            return `${str}-${index}`;
          }
        } catch (e) {
          // Fall through
        }
      }
    }
    return `${prefix}-${index}`;
  };

  if (outOfStockError) {
    return (
      <ErrorMessage
        title="Failed to load out-of-stock products"
        message="Please refresh the page or try again later."
        variant="warning"
      />
    );
  }

  if (outOfStockLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: UI.OUT_OF_STOCK_SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!outOfStockData?.data || !Array.isArray(outOfStockData.data) || outOfStockData.data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-green-100 p-4 rounded-full mb-4">
            <Package className="text-green-600" size={48} />
          </div>
          <p className="text-gray-700 font-semibold text-xl mb-2">All products are in stock!</p>
          <p className="text-gray-500 text-sm">Great job managing your inventory. No action needed.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
          >
            View All Products
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Filter and sort out-of-stock products
  const filteredProducts = (outOfStockData.data as Product[]).filter((product: Product) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.brand?.toLowerCase().includes(searchLower)
    );
  });

  // PERFORMANCE FIX: Memoize sorted products to prevent unnecessary re-sorting
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'brand') {
        comparison = (a.brand || '').localeCompare(b.brand || '');
      } else if (sortBy === 'stock') {
        comparison = (a.totalStock || 0) - (b.totalStock || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredProducts, sortBy, sortOrder]);

  // PERFORMANCE FIX: Paginate out-of-stock products
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedProducts = sortedProducts.slice(startIndex, endIndex);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  return (
    <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-l-4 border-red-600 rounded-xl p-6 shadow-xl animate-fade-in-up relative overflow-hidden">
      {/* Pulsing background effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 opacity-20 rounded-full blur-2xl animate-pulse-slow"></div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="flex-shrink-0 bg-red-100 p-3 rounded-full animate-pulse-slow">
          <AlertTriangle className="text-red-600" size={28} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-red-900">
                ⚠️ Out of Stock Alert
              </h3>
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse-slow">
                {filteredProducts.length} Products
              </span>
            </div>
            <button
              onClick={() => {
                exportOutOfStockProducts(outOfStockData.data as Product[]);
                onExportSuccess('Out-of-stock products exported successfully');
              }}
              className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              title="Export to CSV"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <p className="text-red-800 mb-4 font-medium leading-relaxed">
            The following products are out of stock and cannot be purchased by customers. Please restock as soon as possible to avoid lost sales.
          </p>

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'brand' | 'stock')}
                className="px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="brand">Sort by Brand</option>
                <option value="stock">Sort by Stock</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown size={16} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {displayedProducts.map((product: Product, prodIndex: number) => (
              <div key={getUniqueKey(product?._id, prodIndex, 'product')} className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-red-200 hover:border-red-400 transition-all hover-lift shadow-sm">
                <div className="flex items-center gap-3">
                  <img
                    loading="lazy"
                    src={normalizeImageUrl(product.images?.[0]) || getPlaceholderImage(product.name || 'Product')}
                    alt={product.name || 'Product'}
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.src = getPlaceholderImage(product.name || 'Product');
                    }}
                    className="w-14 h-14 object-cover rounded-lg shadow-md"
                  />
                  <div>
                    <p className="font-bold text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">{product.brand}</span> • Stock: <span className="text-red-600 font-bold">{product.totalStock}</span>
                    </p>
                  </div>
                </div>
                <Link
                  to="/products"
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold text-sm transition-all transform hover:scale-105 shadow-md"
                >
                  Restock
                  <ExternalLink size={16} />
                </Link>
              </div>
            ))}
            {/* PERFORMANCE FIX: Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-red-200">
                <p className="text-sm text-red-800 font-semibold">
                  Showing {startIndex + 1}-{Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} products
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-red-800 font-semibold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            {search && filteredProducts.length === 0 && (
              <p className="text-sm text-red-600 font-medium text-center py-4">
                No products found matching "{search}"
              </p>
            )}
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            View All Out of Stock Products
            <ExternalLink size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
});

OutOfStockSection.displayName = 'OutOfStockSection';

export default OutOfStockSection;

