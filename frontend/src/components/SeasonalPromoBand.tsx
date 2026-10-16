import { Link } from 'react-router-dom';

interface SeasonalPromoBandProps {
  to: string;
  title: string;
  subtitle: string;
  cta: string;
  image: string;
  imageAlt: string;
}

/** Seasonal homepage band. Unmount this from Home after the season ends. */
const SeasonalPromoBand = ({ to, title, subtitle, cta, image, imageAlt }: SeasonalPromoBandProps) => (
  <section className="bg-[#C2410C] text-white" data-home-section="halloween">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-100">Seasonal</p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">{title}</h2>
          <p className="mt-3 max-w-xl text-base text-orange-50 md:text-lg">{subtitle}</p>
          <Link
            to={to}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#9A3412] shadow-md hover:bg-orange-50"
          >
            {cta}
          </Link>
        </div>
        <div className="relative hidden aspect-[16/10] overflow-hidden rounded-2xl shadow-lg md:block">
          <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/50 to-transparent" />
        </div>
      </div>
    </div>
  </section>
);

export default SeasonalPromoBand;
