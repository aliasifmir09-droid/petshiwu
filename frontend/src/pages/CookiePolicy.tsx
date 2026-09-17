import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { COOKIE_INVENTORY } from '@/config/cookies';

const CookiePolicy = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO
        title="Cookie Policy | Petshiwu"
        description="Petshiwu cookie policy: which cookies we use, who provides them, why, how long they last, and how to change your consent."
        url="/cookie-policy"
      />

      <h1 className="text-4xl font-black mb-2 text-gray-900">Cookie Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: September 17, 2026</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Who we are</h2>
          <p>
            Petshiwu is the seller of record at petshiwu.com, packed from 37-68 74th St,
            Jackson Heights, NY 11372 (office and warehouse, not a walk-in store). This page
            lists the cookies and similar technologies we actually use — it is not a copy of the{' '}
            <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">2. How to change consent later</h2>
          <p>
            The cookie banner stores your choice in first-party storage as{' '}
            <code>petshiwu_cookie_consent</code>. To change it:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Clear site data for petshiwu.com in your browser, then reload — the banner appears again.</li>
            <li>Tap <strong>Accept</strong> to allow Google Analytics. Tap <strong>Decline</strong> to keep analytics off.</li>
            <li>Essential cookies (cart, sign-in, checkout processors) are required to shop and cannot be turned off while using those features.</li>
            <li>
              You can also block third-party cookies in your browser, or opt out of Google Analytics at{' '}
              <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline">
                tools.google.com/dlpage/gaoptout
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Cookie inventory</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 border-b">Name</th>
                  <th className="p-3 border-b">Provider</th>
                  <th className="p-3 border-b">Purpose</th>
                  <th className="p-3 border-b">Duration</th>
                  <th className="p-3 border-b">Party</th>
                  <th className="p-3 border-b">Category</th>
                </tr>
              </thead>
              <tbody>
                {COOKIE_INVENTORY.map((row) => (
                  <tr key={row.name} className="border-b border-slate-100 align-top">
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3">{row.provider}</td>
                    <td className="p-3">{row.purpose}</td>
                    <td className="p-3">{row.duration}</td>
                    <td className="p-3">{row.party}</td>
                    <td className="p-3">{row.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Questions</h2>
          <p>
            Email{' '}
            <a href="mailto:support@petshiwu.com" className="text-blue-600 hover:underline">
              support@petshiwu.com
            </a>{' '}
            or see the{' '}
            <Link to="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
};

export default CookiePolicy;
