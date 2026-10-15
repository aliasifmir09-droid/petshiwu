import { NATIONWIDE_FEE_NOTE, NATIONWIDE_WINDOW } from '@/utils/deliveryZones';
import { EXCLUDED_SHIPPING_MESSAGE } from '@/utils/deliveryLane';

const FACTS = [
  {
    title: 'NYC local stock',
    body: 'Same-day when you order by 3 PM weekdays or 1 PM weekends.',
  },
  {
    title: 'Everywhere else in the US',
    body: NATIONWIDE_WINDOW,
  },
  {
    title: 'One delivery fee',
    body: `${NATIONWIDE_FEE_NOTE} Includes NYC.`,
  },
  {
    title: 'Alaska and Hawaii',
    body: `Not yet available. ${EXCLUDED_SHIPPING_MESSAGE}`,
  },
];

const DeliveryWindowExplainer = () => (
  <section className="bg-[#F7F4EE] border-y border-slate-200" aria-labelledby="delivery-window-heading">
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <h2 id="delivery-window-heading" className="text-2xl md:text-3xl font-extrabold text-[#1E3A8A]">
        Wherever you are, here&apos;s when it arrives
      </h2>
      <ul className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FACTS.map((fact) => (
          <li key={fact.title} className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-bold text-stone-900">{fact.title}</p>
            <p className="mt-1 text-sm text-stone-600 leading-relaxed">{fact.body}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default DeliveryWindowExplainer;
