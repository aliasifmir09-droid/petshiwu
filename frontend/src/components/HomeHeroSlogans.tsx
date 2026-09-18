import { Link } from 'react-router-dom';
import {
  BRAND_STORY_LIST,
  HOME_HERO_IMAGE,
  HOME_SLOGAN,
  HOME_SLOGAN_SUPPORT,
  NATIONWIDE_CHIPS,
  NATIONWIDE_SOON_NOTE,
} from '@/data/brandStories';

const HomeHeroSlogans = () => {
  return (
    <section className="bg-white">
      <div className="grid lg:grid-cols-2 min-h-[520px] bg-[#1E3A8A]">
        <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-20">
          <p className="text-[11px] md:text-xs font-bold tracking-[0.22em] uppercase text-amber-200 mb-4">
            Online pet store
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] text-white max-w-xl">
            {HOME_SLOGAN}
          </h1>
          <p className="mt-5 text-lg text-blue-100 max-w-xl leading-relaxed">{HOME_SLOGAN_SUPPORT}</p>
          <p className="mt-3 text-sm text-amber-100/90 max-w-xl">{NATIONWIDE_SOON_NOTE}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dog"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-amber-300 text-[#1E3A8A] font-bold hover:bg-amber-200"
            >
              Shop dogs
            </Link>
            <Link
              to="/cat"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white text-[#1E3A8A] font-bold hover:bg-blue-50"
            >
              Shop cats
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-white/30 text-white font-semibold hover:bg-white/10"
            >
              Shop all
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
        <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-full overflow-hidden bg-[#f7f4ee]">
          <picture>
            <source srcSet={HOME_HERO_IMAGE} type="image/webp" />
            <img
              src="/hero-wide-family.jpg"
              alt="Dog, cat, and macaw — food, treats, and supplies for every pet"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </picture>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BRAND_STORY_LIST.map((story) => (
            <li key={story.path}>
              <Link
                to={story.path}
                className="block h-full rounded-2xl bg-white border border-slate-200 p-6 shadow-lg shadow-slate-900/10 hover:-translate-y-1 hover:border-[#1E3A8A]/30 transition-all"
              >
                <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#D97706] mb-2">
                  {story.kicker}
                </p>
                <p className="text-xl font-bold text-[#1E3A8A] leading-snug">{story.slogan}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HomeHeroSlogans;
