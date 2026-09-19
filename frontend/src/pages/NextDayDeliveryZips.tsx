import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import TonightPromiseCard from '@/components/TonightPromiseCard';
import { generateBreadcrumbSchema } from '@/utils/seoUtils';
import { NEXT_DAY_RADIUS_MILES } from '@/data/nextDayMetroZips';
import { groupNextDayZipsByState, NEXT_DAY_ZIP_COUNT } from '@/data/nextDayMetroDirectory';
import { TONIGHT } from '@/data/tonightDelivery';

const NextDayDeliveryZips = () => {
  const groups = useMemo(() => groupNextDayZipsByState(), []);
  const schema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'DeliveryTimeSettings',
      name: 'Petshiwü next-day metro delivery',
      provider: {
        '@type': 'Organization',
        name: 'Petshiwü',
        url: 'https://www.petshiwu.com',
      },
      shippingDestination: groups.flatMap((group) =>
        group.cities.flatMap((city) =>
          city.zips.map((zip) => ({
            '@type': 'DefinedRegion',
            addressCountry: 'US',
            addressRegion: group.state,
            postalCode: zip,
            name: `${city.city}, ${group.state} ${zip}`,
          }))
        )
      ),
    }),
    [groups]
  );
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!needle) return groups;
    return groups
      .map((group) => ({
        ...group,
        cities: group.cities
          .map((city) => ({
            ...city,
            zips: city.zips.filter(
              (zip) =>
                zip.includes(needle) ||
                city.city.toLowerCase().includes(needle) ||
                group.label.toLowerCase().includes(needle)
            ),
          }))
          .filter((city) => city.zips.length > 0),
      }))
      .filter((group) => group.cities.length > 0);
  }, [groups, needle]);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Next-Day Delivery ZIP Codes Within 50 Miles of Queens | Petshiwu"
        description={`Petshiwü next-day delivery for ${NEXT_DAY_ZIP_COUNT} ZIP codes within ${NEXT_DAY_RADIUS_MILES} miles of Queens. Same-day is NYC only. Check your ZIP. Nationwide shipping opens in a few days.`}
        url="/delivery-zips"
        keywords="next day pet delivery ZIP codes, Queens delivery area, Hicksville pet delivery, Greenwich pet delivery, Nassau pet delivery"
      />
      <StructuredData
        type="breadcrumb"
        data={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Shipping', url: '/shipping' },
          { name: 'Next-day ZIP codes', url: '/delivery-zips' },
        ])}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1E3A8A] mb-3">
          Delivery area
        </p>
        <h1 className="text-4xl font-black text-gray-900 mb-4">
          Next-day ZIPs within {NEXT_DAY_RADIUS_MILES} miles of Queens
        </h1>
        <p className="text-lg text-gray-700 mb-6 max-w-3xl">
          We accept orders for next-day delivery to {NEXT_DAY_ZIP_COUNT} ZIP codes around Queens.
          Same-day stays New York City — all five boroughs — when you order by {TONIGHT.weekdayCutoff} weekdays
          or {TONIGHT.weekendCutoff} weekends. Nationwide shipping opens in a few days. We do not claim
          same-day nationwide.
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

        <div className="mt-10 mb-6">
          <label htmlFor="zip-directory-filter" className="block text-sm font-semibold text-gray-900 mb-2">
            Find a city or ZIP
          </label>
          <input
            id="zip-directory-filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hicksville, 11801, Greenwich…"
            className="w-full max-w-md rounded-xl border border-slate-300 px-4 py-3 font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          />
        </div>

        {visible.map((group) => (
          <section key={group.state} className="mb-10">
            <h2 className="text-2xl font-bold text-[#1E3A8A] mb-4">
              {group.label}{' '}
              <span className="text-base font-semibold text-slate-500">
                {needle ? `${group.cities.reduce((sum, city) => sum + city.zips.length, 0)} showing` : `${group.zipCount} ZIPs`}
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.cities.map((city) => (
                <article key={`${group.state}-${city.city}`} className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold text-gray-900 mb-2">{city.city}</h3>
                  <p className="text-sm font-mono text-slate-700 leading-relaxed">
                    {city.zips.join(', ')}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}

        {visible.length === 0 && (
          <p className="text-slate-600">No matching ZIP in the 50-mile next-day list. Same-day NYC ZIPs are on the checker above.</p>
        )}
      </div>
    </div>
  );
};

export default NextDayDeliveryZips;
