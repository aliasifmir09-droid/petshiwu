import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Product } from '@/types';
import { generateProductUrl } from '@/utils/productUrl';
import { decodeHtmlEntities } from '@/utils/htmlUtils';
import { ratedHubProducts } from '@/data/nycShopHub';

interface HubBuyerRatingsProps {
  products: Product[];
}

const HubBuyerRatings = ({ products }: HubBuyerRatingsProps) => {
  const rated = ratedHubProducts(products);

  return (
    <section className="mb-12" aria-labelledby="hub-ratings-heading">
      <h2 id="hub-ratings-heading" className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-2">
        Buyer ratings on these products
      </h2>
      <p className="text-slate-600 mb-6">
        Only verified catalog ratings. We do not invent review quotes.
      </p>
      {rated.length === 0 ? (
        <p className="text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          Ratings appear here as verified buyers leave them on these SKUs.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rated.map((product) => (
            <li key={String(product._id)}>
              <Link
                to={generateProductUrl(product)}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[#1E3A8A]/40"
              >
                <span className="font-medium text-slate-900 line-clamp-2">
                  {decodeHtmlEntities(product.name)}
                </span>
                <span className="flex items-center gap-1 shrink-0 text-sm font-semibold text-slate-800">
                  <Star size={14} className="text-amber-400 fill-amber-400" aria-hidden />
                  {Number(product.averageRating || 0).toFixed(1)}
                  <span className="text-slate-500 font-medium">({product.totalReviews})</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default HubBuyerRatings;
