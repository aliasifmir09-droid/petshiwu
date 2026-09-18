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
    <section className="relative bg-[#0B1F4A]">
      <div className="relative min-h-[540px] md:min-h-[620px] overflow-hidden">
        <img
          src={HOME_HERO_IMAGE}
          alt="Premium pet food and supplies delivered nationwide"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F4A] via-[#0B1F4A]/88 to-[#0B1F4A]/35" />
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#D97706]" />
        <div className="relative container mx-auto px-4 lg:px-8 py-16 md:py-24">
          <p className="text-[11px] md:text-xs font-bold tracking-[0.22em] uppercase text-amber-200 mb-5">
            Nationwide pet supply
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl leading-[1.08] text-white max-w-3xl">
            {HOME_SLOGAN}
          </h1>
          <p className="mt-5 text-lg md:text-xl text-blue-100 max-w-2xl leading-relaxed">
            {HOME_SLOGAN_SUPPORT}
          </p>
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
      </div>

      <div className="bg-[#f4f1ea] pt-0 pb-4">
        <div className="container mx-auto px-4 lg:px-8">
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-10 md:-mt-14 relative z-10">
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
      </div>
    </section>
  );
};

export default HomeHeroSlogans;
