import { Link } from 'react-router-dom';
import {
  BRAND_STORY_LIST,
  HOME_HERO_IMAGE,
  HOME_HERO_IMAGE_JPG,
  HOME_HERO_IMAGE_WIDE,
  HOME_HERO_IMAGE_WIDE_JPG,
  HOME_SLOGAN,
  HOME_SLOGAN_SUPPORT,
  NATIONWIDE_CHIPS,
  NATIONWIDE_SOON_NOTE,
} from '@/data/brandStories';

const HomeHeroSlogans = () => {
  return (
    <section className="bg-white">
      <div className="grid lg:grid-cols-2 bg-[#1E3A8A] items-stretch">
        <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-16">
          <p className="text-[11px] md:text-xs font-bold tracking-[0.22em] uppercase text-[#F59E0B] mb-4">
            Petshiwu
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] text-white max-w-xl">
            {HOME_SLOGAN}
          </h1>
          <p className="mt-5 text-lg text-blue-100 max-w-xl leading-relaxed">{HOME_SLOGAN_SUPPORT}</p>
          <p className="mt-3 text-sm text-amber-100/90 max-w-xl">{NATIONWIDE_SOON_NOTE}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dog"
              className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#F59E0B] text-[#1E3A8A] font-extrabold hover:bg-[#D97706] hover:text-white"
            >
              Shop dogs
            </Link>
            <Link
              to="/cat"
              className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-white text-[#1E3A8A] font-extrabold hover:bg-blue-50"
            >
              Shop cats
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center h-12 px-7 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10"
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
        <div className="bg-[#f7f4ee] overflow-hidden">
          <picture>
            <source media="(min-width: 1024px)" srcSet={HOME_HERO_IMAGE} type="image/webp" />
            <source media="(min-width: 1024px)" srcSet={HOME_HERO_IMAGE_JPG} />
            <source srcSet={HOME_HERO_IMAGE_WIDE} type="image/webp" />
            <img
              src={HOME_HERO_IMAGE_WIDE_JPG}
              alt="Dog, cat, and macaw — food, treats, and supplies for every pet"
              className="w-full h-auto object-contain object-center"
            />
          </picture>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <ul className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {BRAND_STORY_LIST.map((story) => (
              <li key={story.path}>
                <Link
                  to={story.path}
                  className="block px-2 md:px-8 py-5 hover:bg-slate-50 transition-colors"
                >
                  <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#D97706] mb-1">
                    {story.kicker}
                  </p>
                  <p className="text-base font-bold text-[#1E3A8A] leading-snug">{story.slogan}</p>
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
