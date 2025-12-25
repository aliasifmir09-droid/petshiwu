/**
 * Search Suggestions Component for Admin Dashboard
 * Displays autocomplete suggestions as user types
 */

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Search, Package } from 'lucide-react';
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
    queryKey: ['admin-search-suggestions', query],
    queryFn: async () => {
      // Use the existing getProducts endpoint with search parameter
      const response = await adminService.getProducts({
        search: query,
        limit: 10,
        page: 1
      });
      return {
        products: response.data || []
      };
    },
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

  const products = suggestions?.products || [];
  const hasResults = products.length > 0;

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto"
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
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            Products
          </div>
          <ul className="mt-1">
            {products.map((product: any) => (
              <li key={product._id || product.slug}>
                <button
                  onClick={() => {
                    onSelect(product.name);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                    {product.images?.[0] ? (
                      <img
                        src={normalizeImageUrl(product.images[0])}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={18} className="text-gray-400" />
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
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        product.isActive !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <Search size={16} className="text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;

