const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white" aria-hidden="true">
    <div className="aspect-square animate-pulse bg-stone-100" />
    <div className="space-y-2 p-4">
      <div className="h-3 w-16 animate-pulse rounded bg-stone-100" />
      <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
      <div className="mt-3 h-5 w-20 animate-pulse rounded bg-stone-100" />
      <div className="h-3 w-full animate-pulse rounded bg-stone-100" />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4" role="status" aria-label="Loading products">
    {Array.from({ length: count }, (_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
    <span className="sr-only">Loading products</span>
  </div>
);

export default ProductCardSkeleton;
