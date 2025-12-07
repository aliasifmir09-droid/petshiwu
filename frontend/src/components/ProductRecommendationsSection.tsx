import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import ProductCard from './ProductCard';
import LoadingSpinner from './LoadingSpinner';
import { Sparkles } from 'lucide-react';

interface ProductRecommendationsSectionProps {
  productId: string;
}

const ProductRecommendationsSection = ({ productId }: ProductRecommendationsSectionProps) => {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['productRecommendations', productId],
    queryFn: () => productService.getRecommendations(productId),
    enabled: !!productId
  });

  if (isLoading) {
    return (
      <div className="mt-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!recommendations || !recommendations.recommendations || recommendations.recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-primary-600" />
        <h2 className="text-2xl font-bold">You May Also Like</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.recommendations.slice(0, 4).map((product: any) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductRecommendationsSection;

