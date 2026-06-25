import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';

const ShippingPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO
        title="Shipping Information | PetShiwu — Same-Day NYC Delivery"
        description="Petshiwu ships pet supplies across all 50 US states. Same-day delivery available across NYC: order before 3 PM EST, delivered before 11 PM. Free shipping over $49. Store launches July 15, 2026."
        url="/shipping"
      />

      <h1 className="text-4xl font-black mb-2 text-gray-900">Shipping Information</h1>
      <p className="text-gray-500 mb-8">Last updated: June 24, 2026</p>

      {/* Hero launch banner */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-6 mb-8 text-center shadow-lg">
        <div className="text-2xl font-black mb-1">⚡ Same-Day NYC Delivery</div>
        <p className="text-lg">Order before 3 PM EST — Delivered before 11 PM, today.</p>
        <p className="text-sm mt-2 opacity-90">All 5 NYC boroughs. Free shipping on orders $49+.</p>
      </div>

      {/* Launch countdown banner */}
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-5 mb-10 text-center">
        <div className="text-xl font-black text-yellow-900 mb-1">🚀 Petshiwu Launches July 15, 2026</div>
        <p className="text-yellow-800">Be the first to order. Sign up for early access + launch-day discounts.</p>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { icon: '⚡', title: 'Same-Day NYC', desc: 'Order before 3 PM → delivered by 11 PM' },
          { icon: '🚚', title: 'Free Shipping', desc: 'On all orders over $49' },
          { icon: '📦', title: 'Standard Delivery', desc: '2 business days nationwide' },
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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Same-Day NYC Delivery</h2>
          <div className="bg-green-50 border-l-4 border-green-600 p-5 rounded">
            <p className="font-bold text-gray-900 mb-2">Our promise to NYC pet owners:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Order before 3:00 PM EST</strong> on any business day.</li>
              <li><strong>Delivery before 11:00 PM</strong> the same day.</li>
              <li>Available across <strong>all 5 NYC boroughs</strong>: Manhattan, Brooklyn, Queens, Bronx, Staten Island.</li>
              <li>Plus Jersey City, Hoboken, Long Island City, and select Westchester addresses.</li>
              <li>Same-day delivery included free on orders $49+. Just $6 on smaller orders.</li>
            </ul>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Place your order at petshiwu.com before 3 PM EST on weekdays (or 1 PM on weekends) and receive your pet supplies the same evening. Our Jackson Heights fulfillment team hand-picks, packs, and dispatches every order for the day's delivery routes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Shipping Rates</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm mt-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Order Total</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Same-Day NYC</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Standard Shipping</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Express Shipping</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-gray-200">Under $49</td>
                  <td className="p-3 border border-gray-200 font-semibold text-blue-700">$6</td>
                  <td className="p-3 border border-gray-200">$5.99</td>
                  <td className="p-3 border border-gray-200">$14.99</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="p-3 border border-gray-200 font-semibold">$49 and over</td>
                  <td className="p-3 border border-gray-200 font-bold text-green-700">FREE</td>
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
            <li><strong>Same-Day NYC:</strong> Order before 3 PM EST → delivered before 11 PM same day. Order before 1 PM EST on weekends/holidays.</li>
            <li><strong>Standard Shipping:</strong> 2 business days nationwide after order confirmation (improved from 5 days).</li>
            <li><strong>Express Shipping:</strong> 1-2 business days nationwide after order confirmation.</li>
            <li>All orders placed before 2 PM EST on business days are processed the same day.</li>
            <li>Orders placed after 2 PM EST, on weekends, or holidays are processed the next business day.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">
            Note: Delivery times are estimates and not guaranteed. Same-day NYC orders placed before the 3 PM cutoff are guaranteed to arrive before 11 PM. Nationwide shipping times may vary due to carrier delays, weather, or high order volumes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Where We Ship</h2>
          <p>
            <strong>Same-day delivery:</strong> All 5 NYC boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island), plus Jersey City, Hoboken, Long Island City, and select Westchester addresses.
          </p>
          <p className="mt-2">
            <strong>Standard + Express nationwide:</strong> All 50 US states and Washington D.C. We are based in Jackson Heights, NY and offer particularly fast delivery across the New York City metro area.
          </p>
          <p className="mt-2">
            International shipping is not available at this time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Order Tracking</h2>
          <p>
            Once your order ships, you will receive a confirmation email with your tracking number. Same-day NYC orders receive real-time tracking with delivery ETA updates via SMS and email. You can also track your order on our{' '}
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

        <section className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">🚀 Launching July 15, 2026</h2>
          <p className="text-gray-700 mb-3">Petshiwu officially opens to the public on July 15, 2026.</p>
          <p className="text-gray-700">Be the first to order and lock in launch-day pricing + exclusive early-access discounts.</p>
          <Link to="/products" className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full transition-colors">
            Shop Pet Supplies
          </Link>
        </section>

      </div>
    </div>
  );
};

export default ShippingPolicy;
