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
    <section className="bg-[#F7F4EE]">
      <div className="grid lg:grid-cols-2 items-stretch">
        <div className="order-2 lg:order-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 lg:py-20">
          <p className="mb-4 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1E3A8A]/70">
            NYC same-day delivery
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] tracking-tight text-[#1E3A8A] max-w-xl">
            {HOME_SLOGAN}
          </h1>
          <p className="mt-5 text-base lg:text-lg text-slate-600 max-w-xl leading-relaxed">{HOME_SLOGAN_SUPPORT}</p>
          <p className="mt-3 text-sm text-slate-500 max-w-xl">{NATIONWIDE_SOON_NOTE}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/dog"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-[#1E3A8A] text-white font-semibold shadow-sm hover:bg-[#163074] hover:shadow-md transition-all"
            >
              Shop dogs
            </Link>
            <Link
              to="/cat"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-[#1E3A8A]/25 bg-white text-[#1E3A8A] font-semibold hover:border-[#1E3A8A] hover:bg-white/80 transition-colors"
            >
              Shop cats
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center h-12 px-3 text-[#1E3A8A] font-semibold hover:underline underline-offset-4"
            >
              Shop all
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {NATIONWIDE_CHIPS.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full border border-[#1E3A8A]/10 bg-white/80 px-3 py-1 text-xs font-semibold text-[#1E3A8A]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2 relative h-56 sm:h-80 lg:h-auto lg:min-h-[560px] overflow-hidden bg-[#F4F1EA]">
          <picture>
            <source media="(min-width: 1024px)" srcSet={HOME_HERO_IMAGE} type="image/webp" />
            <source media="(min-width: 1024px)" srcSet={HOME_HERO_IMAGE_JPG} />
            <source srcSet={HOME_HERO_IMAGE_WIDE} type="image/webp" />
            <img
              src={HOME_HERO_IMAGE_WIDE_JPG}
              alt="Dog, cat, and macaw with Petshiwü food and bags"
              className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
            />
          </picture>
        </div>
      </div>

      <div className="border-t border-[#1E3A8A]/8 bg-white/70">
        <div className="container mx-auto px-4 lg:px-8">
          <ul className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
            {BRAND_STORY_LIST.map((story) => (
              <li key={story.path}>
                <Link
                  to={story.path}
                  className="block px-2 md:px-8 py-5 hover:bg-white transition-colors"
                >
                  <p className="text-[11px] font-semibold tracking-wide uppercase text-[#1E3A8A]/60 mb-1">
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
