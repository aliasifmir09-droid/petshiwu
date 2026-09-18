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
      <div className="grid lg:grid-cols-2 items-stretch border-b border-slate-200">
        <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-16 bg-white">
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.12] tracking-tight text-[#1E3A8A] max-w-xl">
            {HOME_SLOGAN}
          </h1>
          <p className="mt-5 text-base lg:text-lg text-slate-600 max-w-xl leading-relaxed">{HOME_SLOGAN_SUPPORT}</p>
          <p className="mt-3 text-sm text-slate-500 max-w-xl">{NATIONWIDE_SOON_NOTE}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/dog"
              className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-[#1E3A8A] text-white font-semibold hover:bg-[#163074]"
            >
              Shop dogs
            </Link>
            <Link
              to="/cat"
              className="inline-flex items-center justify-center h-11 px-6 rounded-md border border-slate-300 text-[#1E3A8A] font-semibold hover:border-[#1E3A8A] hover:bg-slate-50"
            >
              Shop cats
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center h-11 px-2 text-[#1E3A8A] font-semibold hover:underline"
            >
              Shop all
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            {NATIONWIDE_CHIPS.join('  ·  ')}
          </p>
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

      <div className="bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto px-4 lg:px-8">
          <ul className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {BRAND_STORY_LIST.map((story) => (
              <li key={story.path}>
                <Link
                  to={story.path}
                  className="block px-2 md:px-8 py-4 hover:bg-white transition-colors"
                >
                  <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 mb-1">
                    {story.kicker}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 leading-snug">{story.slogan}</p>
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
