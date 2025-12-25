/**
 * Search Suggestions Component
 * Displays autocomplete suggestions as user types
 */

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productService } from '@/services/products';
import { Search, Package, FolderTree } from 'lucide-react';
import { normalizeImageUrl } from '@/utils/imageUtils';

interface SearchSuggestionsProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (query: string) => void;
}

const SearchSuggestions = ({ query, isOpen, onClose, onSelect }: SearchSuggestionsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when query is at least 2 characters
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => productService.getSearchSuggestions(query),
    enabled: isOpen && query.length >= 2,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || query.length < 2) {
    return null;
  }

  const products = suggestions?.data?.products || [];
  const categories = suggestions?.data?.categories || [];
  const hasResults = products.length > 0 || categories.length > 0;

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
    >
      {isLoading ? (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm">Searching...</p>
        </div>
      ) : !hasResults ? (
        <div className="p-4 text-center text-gray-500">
          <p className="text-sm">No products found for "{query}"</p>
        </div>
      ) : (
        <div className="py-2">
          {/* Products Section */}
          {products.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Products
              </div>
              <ul className="mt-1">
                {products.map((product: any) => (
                  <li key={product._id || product.slug}>
                    <Link
                      to={`/products/${product.slug}`}
                      onClick={() => onSelect(product.name)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        {product.images?.[0] ? (
                          <img
                            src={normalizeImageUrl(product.images[0])}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {product.brand && (
                            <span className="text-xs text-gray-500">{product.brand}</span>
                          )}
                          {product.basePrice && (
                            <span className="text-xs font-semibold text-green-600">
                              ${product.basePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Search size={16} className="text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Categories Section */}
          {categories.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Categories
              </div>
              <ul className="mt-1">
                {categories.map((category: any) => (
                  <li key={category._id || category.slug}>
                    <Link
                      to={`/${category.petType}/${category.slug}`}
                      onClick={() => onSelect(category.name)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <FolderTree size={20} className="text-gray-400 group-hover:text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                          {category.name}
                        </p>
                        {category.petType && (
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {category.petType} Supplies
                          </p>
                        )}
                      </div>
                      <Search size={16} className="text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* View All Results Link */}
          <div className="border-t border-gray-100 mt-2">
            <Link
              to={`/products?search=${encodeURIComponent(query)}`}
              onClick={() => onSelect(query)}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Search size={16} />
              View all results for "{query}"
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;

