import { EXCLUDED_SHIPPING_MESSAGE } from '@/utils/deliveryLane';
import { FEE_FREE_LABEL, FEE_UNDER_LABEL, NATIONWIDE_WINDOW, SAME_DAY_LOCAL_PHRASE } from '@/utils/deliveryZones';

const FACTS = [
  {
    title: 'Nationwide',
    body: NATIONWIDE_WINDOW,
  },
  {
    title: 'Our home city',
    body: SAME_DAY_LOCAL_PHRASE,
  },
  {
    title: 'One delivery fee',
    body: `${FEE_FREE_LABEL}. ${FEE_UNDER_LABEL}.`,
  },
  {
    title: 'Alaska and Hawaii',
    body: `Not yet available. ${EXCLUDED_SHIPPING_MESSAGE}`,
  },
];

const DeliveryWindowExplainer = () => (
  <section className="border-y border-stone-200 bg-white" aria-labelledby="delivery-window-heading">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <h2 id="delivery-window-heading" className="text-xl font-medium tracking-[-0.02em] text-stone-900 md:text-2xl">
        Wherever you are, here&apos;s when it arrives
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FACTS.map((fact) => (
          <li key={fact.title} className="rounded-2xl border border-stone-200 bg-[#F7F6F3] p-5">
            <p className="text-sm font-medium text-stone-900">{fact.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{fact.body}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default DeliveryWindowExplainer;
