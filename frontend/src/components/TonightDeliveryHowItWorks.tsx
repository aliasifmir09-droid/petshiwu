import { Link } from 'react-router-dom';
import { TONIGHT, TONIGHT_STEPS } from '@/data/tonightDelivery';

interface TonightDeliveryHowItWorksProps {
  compact?: boolean;
}

const TonightDeliveryHowItWorks = ({ compact = false }: TonightDeliveryHowItWorksProps) => {
  const heading = (
    <div className={`max-w-3xl ${compact ? '' : 'mx-auto text-center'} mb-8`}>
      <h2 id="tonight-how-heading" className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-2">
        How tonight delivery works
      </h2>
      <p className="text-slate-600">{TONIGHT.promise}</p>
    </div>
  );

  const steps = (
    <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TONIGHT_STEPS.map((step, index) => (
        <li key={step.title} className="bg-white rounded-xl border border-slate-100 p-5 text-left">
          <p className="text-xs font-semibold text-[#1E3A8A] mb-2">Step {index + 1}</p>
          <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{step.text}</p>
        </li>
      ))}
    </ol>
  );

  if (compact) {
    return (
      <section className="py-8 mb-8" aria-labelledby="tonight-how-heading">
        {heading}
        {steps}
      </section>
    );
  }

  return (
    <section className="py-12 bg-slate-50" aria-labelledby="tonight-how-heading">
      <div className="container mx-auto px-4 lg:px-8">
        {heading}
        {steps}
        <p className="text-center mt-8">
          <Link
            to="/products"
            className="inline-flex items-center bg-[#1E3A8A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1e40af]"
          >
            Shop tonight
          </Link>
        </p>
      </div>
    </section>
  );
};

export default TonightDeliveryHowItWorks;
