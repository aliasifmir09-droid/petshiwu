import { Link } from 'react-router-dom';
import {
  BRAND_STORY_LIST,
  HOME_HERO_IMAGE,
  HOME_SLOGAN,
  HOME_SLOGAN_SUPPORT,
  NATIONWIDE_CHIPS,
} from '@/data/brandStories';

const HomeHeroSlogans = () => {
  return (
    <section className="bg-[#f4f1ea]">
      <div className="h-1.5 w-full bg-[#D97706]" />
      <div className="grid lg:grid-cols-2 min-h-[560px] bg-[#0B1F4A]">
        <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-14 lg:py-20">
          <p className="text-[11px] md:text-xs font-bold tracking-[0.22em] uppercase text-amber-200 mb-5">
            Nationwide pet supply
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.08] text-white max-w-xl">
            {HOME_SLOGAN}
          </h1>
          <p className="mt-5 text-lg text-blue-100 max-w-xl leading-relaxed">{HOME_SLOGAN_SUPPORT}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-amber-300 text-[#0B1F4A] font-bold hover:bg-amber-200"
            >
              Shop now
            </Link>
            <Link
              to="/our-promise"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full border border-white/30 text-white font-semibold hover:bg-white/10"
            >
              Read our promise
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {NATIONWIDE_CHIPS.map((chip) => (
              <li
                key={chip}
                className="text-xs font-semibold tracking-wide bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 text-blue-50"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative min-h-[280px] lg:min-h-full">
          <img
            src={HOME_HERO_IMAGE}
            alt="Dog, cat, and bird — premium pet care delivered nationwide"
            className="absolute inset-0 h-full w-full object-cover object-[78%_center]"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-8 md:-mt-10 relative z-10 pb-2">
          {BRAND_STORY_LIST.map((story) => (
            <li key={story.path}>
              <Link
                to={story.path}
                className="block h-full rounded-2xl bg-white border border-[#e7e0d4] p-6 shadow-xl shadow-[#0B1F4A]/10 hover:-translate-y-1 hover:border-[#D97706]/40 transition-all"
              >
                <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#D97706] mb-2">
                  {story.kicker}
                </p>
                <p className="font-serif text-2xl text-[#1E3A8A] leading-snug">{story.slogan}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HomeHeroSlogans;
