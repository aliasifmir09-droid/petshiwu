import { Link } from 'react-router-dom';
import { NYC_HUB_LINKS } from '@/data/nycShopHub';

interface NycHubLinkGridProps {
  excludePath?: string;
}

const NycHubLinkGrid = ({ excludePath }: NycHubLinkGridProps) => {
  const links = NYC_HUB_LINKS.filter((item) => item.path !== excludePath);

  return (
    <section className="py-12" aria-labelledby="nyc-hub-links-heading">
      <div className={excludePath ? '' : 'container mx-auto px-4 lg:px-8'}>
        <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 mb-2">
          Delivery
        </p>
        <h2 id="nyc-hub-links-heading" className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-2">
          NYC same-day now · nationwide shipping next
        </h2>
        <p className="text-slate-600 mb-6 max-w-2xl">
          Same-day is the five boroughs only. Next-day is every ZIP within 50 miles of Queens.{' '}
          <Link to="/delivery-zips" className="text-[#1E3A8A] font-semibold hover:underline">
            Full ZIP list
          </Link>
          {' · '}
          <Link
            to="/learning/next-day-pet-delivery-within-50-miles-of-queens"
            className="text-[#1E3A8A] font-semibold hover:underline"
          >
            How next-day works
          </Link>
          . We do not claim same-day nationwide.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {links.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className="block h-full rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#1E3A8A]/40 hover:shadow-sm"
              >
                <h3 className="font-semibold text-[#1E3A8A] mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default NycHubLinkGrid;
