import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import TonightPromiseCard from '@/components/TonightPromiseCard';
import { generateBreadcrumbSchema } from '@/utils/seoUtils';
import { TONIGHT } from '@/data/tonightDelivery';
import { SAME_DAY_PRODUCT_ELIGIBILITY } from '@/utils/deliveryZip';

const NextDayDeliveryZips = () => {
  const breadcrumb = useMemo(
    () =>
      generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Shipping', url: '/shipping' },
        { name: 'NYC delivery', url: '/delivery-zips' },
      ]),
    []
  );

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="NYC Same-Day Delivery | Petshiwu"
        description="Petshiwü delivers same-day in New York City — Manhattan, Brooklyn, Queens, the Bronx, and Staten Island. In-stock products are eligible for same-day delivery. Shipped items go nationwide in 2-5 business days."
        url="/delivery-zips"
        keywords="NYC same-day pet delivery, Queens pet delivery, Brooklyn pet delivery, Manhattan pet delivery"
      />
      <StructuredData type="breadcrumb" data={breadcrumb} />

      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1E3A8A] mb-3">
          Delivery area
        </p>
        <h1 className="text-4xl font-black text-gray-900 mb-4">
          Same-day delivery in New York City
        </h1>
        <p className="text-lg text-gray-700 mb-6 max-w-3xl">
          We deliver same-day across Manhattan, Brooklyn, Queens, the Bronx, and Staten Island
          when you order by {TONIGHT.weekdayCutoff} weekdays or {TONIGHT.weekendCutoff} weekends.
          In-stock local products are {SAME_DAY_PRODUCT_ELIGIBILITY.toLowerCase()}. Locally stocked items
          arrive in 2-5 business days anywhere in the US except Alaska and Hawaii. Same-day is only for locally stocked items in New York City.{' '}
          <Link
            to="/learning/next-day-pet-delivery-within-50-miles-of-queens"
            className="text-[#1E3A8A] font-semibold hover:underline"
          >
            Read the NYC same-day delivery guide
          </Link>
          .
        </p>
        <p className="text-sm text-gray-600 mb-8">
          Packed from Jackson Heights. Not a walk-in store.{' '}
          <Link to="/shipping" className="text-[#1E3A8A] font-semibold hover:underline">
            Shipping information
          </Link>
          {' · '}
          <Link to="/products" className="text-[#1E3A8A] font-semibold hover:underline">
            Shop in-stock
          </Link>
        </p>

        <TonightPromiseCard variant="landing" shopHref="/products" />
      </div>
    </div>
  );
};

export default NextDayDeliveryZips;
