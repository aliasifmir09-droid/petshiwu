import { Link } from 'react-router-dom';
import { FolderTree, ChevronRight } from 'lucide-react';
import { CategoryGroup } from '@/pages/Dashboard';

interface CategoryNavigationSectionProps {
  categoriesByPet: Record<string, CategoryGroup>;
  categoriesLoading: boolean;
  petTypesLoading: boolean;
}

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

const CategoryNavigationSection = ({
  categoriesByPet,
  categoriesLoading,
  petTypesLoading,
}: CategoryNavigationSectionProps) => {
  if (categoriesLoading || petTypesLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-xl border-2 border-indigo-200 overflow-hidden">
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">Loading navigation menu structure...</div>
        </div>
      </div>
    );
  }

  if (Object.keys(categoriesByPet).length === 0) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-xl border-2 border-indigo-200 overflow-hidden">
        <div className="p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <FolderTree className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Navigation Menu Categories</h2>
                <p className="text-indigo-100 text-sm mt-1">Categories visible in the website navigation menu</p>
              </div>
            </div>
            <Link
              to="/categories"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Manage Categories
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium mb-2">No categories configured</p>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Create your first category
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-xl border-2 border-indigo-200 hover:shadow-2xl transition-all animate-fade-in-up overflow-hidden">
      <div className="p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <FolderTree className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Navigation Menu Categories</h2>
              <p className="text-indigo-100 text-sm mt-1">Categories visible in the website navigation menu</p>
            </div>
          </div>
          <Link
            to="/categories"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
          >
            Manage Categories
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(categoriesByPet).map(([petTypeSlug, data]: [string, CategoryGroup]) => (
            <div
              key={petTypeSlug}
              className="bg-white rounded-xl p-5 border-2 border-indigo-100 hover:border-indigo-300 transition-all hover-lift shadow-md"
            >
              {/* Pet Type Header */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="text-4xl">{data.petType.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-gray-900">{data.petType.name}</h3>
                  <p className="text-sm text-gray-600">{data.petType.description || 'Pet type category'}</p>
                </div>
                {data.petType.isActive ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    Active
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                    Inactive
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-blue-600 text-xs font-semibold uppercase">Main Categories</div>
                  <div className="text-2xl font-black text-blue-900 mt-1">{data.mainCategories.length}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-purple-600 text-xs font-semibold uppercase">Subcategories</div>
                  <div className="text-2xl font-black text-purple-900 mt-1">{data.totalSubcategories}</div>
                </div>
              </div>

              {/* Categories List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.mainCategories.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No main categories yet</p>
                ) : (
                  data.mainCategories.map((category, catIndex: number) => (
                    <Link
                      key={getUniqueKey(category?._id, catIndex, 'category')}
                      to="/categories"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                          {category.name}
                        </span>
                      </div>
                      {!category.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </Link>
                  ))
                )}
              </div>

              {/* View All Link */}
              {data && data.mainCategories && data.mainCategories.length > 0 && (
                <Link
                  to={`/categories?petType=${petTypeSlug}`}
                  className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold w-full justify-center py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  View All Categories
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryNavigationSection;

