import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';

const ShippingPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO
        title="Shipping Information | PetShiwu"
        description="Learn about PetShiwu's shipping rates, delivery times, and policies. Free shipping on orders over $49."
        url="/shipping"
      />

      <h1 className="text-4xl font-black mb-2 text-gray-900">Shipping Information</h1>
      <p className="text-gray-500 mb-8">Last updated: May 20, 2026</p>

      {/* Quick summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { icon: '🚚', title: 'Free Shipping', desc: 'On all orders over $49' },
          { icon: '📦', title: 'Standard Delivery', desc: '3-7 business days' },
          { icon: '⚡', title: 'Express Delivery', desc: '1-2 business days (fee applies)' },
        ].map((item, i) => (
          <div key={i} className="bg-blue-50 rounded-xl p-5 text-center border border-blue-100">
            <div className="text-3xl mb-2">{item.icon}</div>
            <h3 className="font-bold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Shipping Rates</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm mt-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Order Total</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Standard Shipping</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Express Shipping</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-gray-200">Under $49</td>
                  <td className="p-3 border border-gray-200">$5.99</td>
                  <td className="p-3 border border-gray-200">$14.99</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="p-3 border border-gray-200 font-semibold">$49 and over</td>
                  <td className="p-3 border border-gray-200 font-semibold text-green-700">FREE</td>
                  <td className="p-3 border border-gray-200">$9.99</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Delivery Times</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Standard Shipping:</strong> 3-7 business days after order confirmation.</li>
            <li><strong>Express Shipping:</strong> 1-2 business days after order confirmation.</li>
            <li>Orders placed before 2 PM EST on business days are processed the same day.</li>
            <li>Orders placed on weekends or holidays are processed the next business day.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">
            Note: Delivery times are estimates and not guaranteed. Delays may occur due to carrier
            delays, weather, or high order volumes (especially around holidays).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Where We Ship</h2>
          <p>
            We currently ship to all 50 US states and Washington D.C. We are based in Jackson Heights,
            NY and offer particularly fast delivery across the New York City metro area.
          </p>
          <p className="mt-2">International shipping is not available at this time.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Order Tracking</h2>
          <p>
            Once your order ships, you will receive a confirmation email with your tracking number.
            You can also track your order on our{' '}
            <Link to="/track-order" className="text-blue-600 hover:underline">Order Tracking page</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Damaged or Missing Orders</h2>
          <p>
            If your order arrives damaged or is lost in transit, please contact us within 7 days of
            the expected delivery date. We will work with the carrier to resolve the issue and
            ship a replacement or issue a refund.
          </p>
          <p className="mt-2">
            Contact:{' '}
            <a href="mailto:support@petshiwu.com" className="text-blue-600 hover:underline">
              support@petshiwu.com
            </a>{' '}
            or <a href="tel:+18002592605" className="text-blue-600 hover:underline">+1 (800) 259-2605</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Returns</h2>
          <p>
            Not satisfied with your order? Visit our{' '}
            <Link to="/return-policy" className="text-blue-600 hover:underline">Return & Exchange Policy</Link>{' '}
            for full details on how to return items.
          </p>
        </section>

      </div>
    </div>
  );
};

export default ShippingPolicy;
