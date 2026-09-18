import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { ORDERING_PAUSED, ORDERING_PAUSED_HEADLINE } from '@/config/ordering';
import {
  DAMAGED_ITEM_REPORT_DAYS,
  DELIVERY_STATEMENT,
  POLICY_EFFECTIVE_DATE,
  RETURN_WINDOW_DAYS,
} from '@/config/storePolicies';
import { TONIGHT } from '@/data/tonightDelivery';

const ShippingPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO
        title="Shipping Information | Petshiwu"
        description="Petshiwu shipping: currently delivering in NYC. Nationwide shipping opens in a few days. Free over $49. No autoship."
        url="/shipping"
      />

      <h1 className="text-4xl font-black mb-2 text-gray-900">Shipping Information</h1>
      <p className="text-gray-500 mb-8">Effective {POLICY_EFFECTIVE_DATE}</p>

      {ORDERING_PAUSED && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
          <p className="font-bold text-[#1E3A8A] mb-1">{ORDERING_PAUSED_HEADLINE}</p>
          <p className="text-sm text-stone-700">
            Checkout is paused, so nothing ships today. The times below are the delivery rules that apply when we start accepting orders.
          </p>
        </div>
      )}

      <div className="bg-[#0B1F4A] text-white rounded-2xl p-6 mb-8">
        <p className="text-sm uppercase tracking-widest text-amber-200 font-semibold mb-2">One delivery statement</p>
        <p className="text-lg font-semibold leading-relaxed">{DELIVERY_STATEMENT}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { title: 'Weekdays', desc: `Order by ${TONIGHT.weekdayCutoff} ET → before ${TONIGHT.deliverBy}` },
          { title: 'Weekends', desc: `Order by ${TONIGHT.weekendCutoff} ET → before ${TONIGHT.deliverBy}` },
          { title: 'After cutoff', desc: 'Next-day across the five boroughs' },
        ].map((item) => (
          <div key={item.title} className="bg-blue-50 rounded-xl p-5 text-center border border-blue-100">
            <h3 className="font-bold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Cutoff matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm mt-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">When you order</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Cutoff (ET)</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">What happens</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-gray-200">Monday–Friday</td>
                  <td className="p-3 border border-gray-200 font-semibold">{TONIGHT.weekdayCutoff}</td>
                  <td className="p-3 border border-gray-200">We aim to deliver before {TONIGHT.deliverBy} the same day</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border border-gray-200">Saturday–Sunday</td>
                  <td className="p-3 border border-gray-200 font-semibold">{TONIGHT.weekendCutoff}</td>
                  <td className="p-3 border border-gray-200">We aim to deliver before {TONIGHT.deliverBy} the same day</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200">After cutoff, any day</td>
                  <td className="p-3 border border-gray-200">—</td>
                  <td className="p-3 border border-gray-200">Next-day delivery in the five boroughs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Rates</h2>
          <table className="w-full border-collapse text-sm mt-3">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-3 border border-gray-200 font-semibold">Order total</th>
                <th className="text-left p-3 border border-gray-200 font-semibold">Shipping</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border border-gray-200">Under ${TONIGHT.freeOver}</td>
                <td className="p-3 border border-gray-200 font-semibold">${TONIGHT.underFee}</td>
              </tr>
              <tr className="bg-green-50">
                <td className="p-3 border border-gray-200 font-semibold">${TONIGHT.freeOver} and over</td>
                <td className="p-3 border border-gray-200 font-bold text-green-700">FREE</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Where we deliver</h2>
          <p>
            <strong>Currently delivering:</strong> Manhattan, Brooklyn, Queens, the Bronx, and Staten Island,
            with same-day when you order by cutoff. Nearby New Jersey and Westchester ZIPs may be next-day.
          </p>
          <p className="mt-2">
            <strong>Nationwide shipping opens in a few days</strong> for other U.S. addresses, free over $49.
            International shipping is not available yet. We pack from our warehouse — it is not a walk-in store.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Same-day is a target, not a guarantee</h2>
          <p>
            Weather, traffic, and volume can delay a route. We still try to arrive before {TONIGHT.deliverBy} when you order before cutoff.
            If we miss that window, email{' '}
            <a href="mailto:support@petshiwu.com" className="text-blue-600 hover:underline">support@petshiwu.com</a>
            {' '}and we will reship the next day free or refund the order.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Damaged or missing orders</h2>
          <p>
            Tell us within {DAMAGED_ITEM_REPORT_DAYS} days of the expected delivery date. We will replace the item or refund it.
            Photos help for damage claims.
          </p>
          <p className="mt-2">
            Contact:{' '}
            <a href="mailto:support@petshiwu.com" className="text-blue-600 hover:underline">support@petshiwu.com</a>
            {' '}or <a href="tel:+18002592605" className="text-blue-600 hover:underline">+1 (800) 259-2605</a> (24/7).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Returns</h2>
          <p>
            Unused items can be returned within <strong>{RETURN_WINDOW_DAYS} days</strong> of delivery. See the{' '}
            <Link to="/return-policy" className="text-blue-600 hover:underline">Return & Exchange Policy</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicy;
