import { NYC_HUB_COMPARE_HEADING, NYC_HUB_COMPARE_ROWS } from '@/data/nycShopHub';

const NycHubCompare = () => (
  <section className="mb-10 overflow-x-auto" aria-labelledby="hub-compare-heading">
    <h2 id="hub-compare-heading" className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-4">
      {NYC_HUB_COMPARE_HEADING}
    </h2>
    <table className="w-full min-w-[36rem] text-left text-sm border border-slate-200 rounded-xl overflow-hidden">
      <thead className="bg-[#1E3A8A] text-white">
        <tr>
          <th scope="col" className="px-4 py-3 font-semibold">
            {' '}
          </th>
          <th scope="col" className="px-4 py-3 font-semibold">
            Petshiwü
          </th>
          <th scope="col" className="px-4 py-3 font-semibold">
            Manhattan-only shops
          </th>
          <th scope="col" className="px-4 py-3 font-semibold">
            National sites
          </th>
        </tr>
      </thead>
      <tbody>
        {NYC_HUB_COMPARE_ROWS.map((row) => (
          <tr key={row.label} className="border-t border-slate-200 odd:bg-white even:bg-slate-50">
            <th scope="row" className="px-4 py-3 font-semibold text-slate-800 align-top">
              {row.label}
            </th>
            <td className="px-4 py-3 text-slate-800 font-medium">{row.petshiwu}</td>
            <td className="px-4 py-3 text-slate-600">{row.manhattanShop}</td>
            <td className="px-4 py-3 text-slate-600">{row.national}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

export default NycHubCompare;
