import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/categories';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ChevronRight, Home } from 'lucide-react';

const PetType = () => {
  const { petType } = useParams<{ petType: string }>();
  const [searchParams] = useSearchParams();
  
  // Fetch categories for this pet type (only parent/main categories)
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', petType, 'main'],
    queryFn: () => categoryService.getCategories(petType || undefined),
    enabled: !!petType,
    retry: 1
  });

  // Filter to show only main/parent categories (no parentCategory)
  const mainCategories = categories?.filter(cat => !cat.parentCategory) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const petTypeDisplay = petType ? petType.charAt(0).toUpperCase() + petType.slice(1) : '';

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li className="flex items-center">
            <Link
              to="/"
              className="hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              <Home size={16} />
              Home
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            <span className="font-medium text-gray-900">{petTypeDisplay}</span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{petTypeDisplay} Products</h1>
        <p className="text-gray-600">
          Browse our selection of {petTypeDisplay.toLowerCase()} products by category
        </p>
      </div>

      {/* Categories Grid */}
      {mainCategories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {mainCategories.map((category) => (
            <Link
              key={category._id}
              to={`/category/${category.slug}`}
              className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 text-center border border-gray-200 hover:border-primary-500"
            >
              {category.image && (
                <div className="mb-4 aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              )}
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {category.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No categories found for {petTypeDisplay}.</p>
        </div>
      )}
    </div>
  );
};

export default PetType;

