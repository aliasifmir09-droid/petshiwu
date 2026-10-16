import { EXCLUDED_SHIPPING_MESSAGE } from '@/utils/deliveryLane';
import { FEE_FREE_LABEL, FEE_UNDER_LABEL, NATIONWIDE_WINDOW, SAME_DAY_LOCAL_PHRASE } from '@/utils/deliveryZones';

const FACTS = [
  {
    title: 'Nationwide',
    body: NATIONWIDE_WINDOW,
    rule: 'bg-[#1E3A8A]',
    pill: '2-5 business days',
    pillClass: 'bg-blue-50 text-[#1E3A8A]',
  },
  {
    title: 'Our home city',
    body: SAME_DAY_LOCAL_PHRASE,
    rule: 'bg-[#F59E0B]',
    pill: 'same-day',
    pillClass: 'bg-orange-100 text-[#D97706]',
  },
  {
    title: 'One delivery fee',
    body: `${FEE_FREE_LABEL}. ${FEE_UNDER_LABEL}.`,
    rule: 'bg-[#1E3A8A]',
    pill: '',
    pillClass: '',
  },
  {
    title: 'Alaska and Hawaii',
    body: `Not yet available. ${EXCLUDED_SHIPPING_MESSAGE}`,
    rule: 'bg-slate-300',
    pill: '',
    pillClass: '',
  },
];

const DeliveryWindowExplainer = () => (
  <section className="bg-white" aria-labelledby="delivery-window-heading" data-home-section="delivery">
    <div className="container mx-auto px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-orange">Delivery</p>
      <h2 id="delivery-window-heading" className="mt-1 text-2xl font-extrabold text-[#1E3A8A]">
        Wherever you are, here&apos;s when it arrives
      </h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FACTS.map((fact) => (
          <li key={fact.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className={`h-1.5 ${fact.rule}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-bold text-[#1E3A8A]">{fact.title}</p>
                {fact.pill ? (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${fact.pillClass}`}>
                    {fact.pill}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{fact.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default DeliveryWindowExplainer;
