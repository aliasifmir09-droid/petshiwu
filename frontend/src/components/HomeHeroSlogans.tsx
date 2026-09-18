import { Link } from 'react-router-dom';
import { BRAND_STORY_LIST, HOME_SLOGAN, HOME_SLOGAN_SUPPORT } from '@/data/brandStories';

const HomeHeroSlogans = () => {
  return (
    <section className="relative overflow-hidden bg-[#f4f1ea] border-b border-[#e7e0d4]">
      <div className="h-1.5 w-full bg-[#D97706]" />
      <div className="container mx-auto px-4 lg:px-8 py-12 md:py-16">
        <p className="text-[11px] md:text-xs font-bold tracking-[0.18em] uppercase text-[#D97706] mb-4">
          NYC same-day pet supply
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl leading-[1.15] text-[#1E3A8A] max-w-4xl">
          {HOME_SLOGAN}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-[#44403c] max-w-2xl">{HOME_SLOGAN_SUPPORT}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/products"
            className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-[#1E3A8A] text-white font-bold hover:bg-[#16307a]"
          >
            Shop tonight
          </Link>
          <Link
            to="/our-promise"
            className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-[#1E3A8A]/20 text-[#1E3A8A] font-semibold bg-white hover:bg-white/80"
          >
            Read our promise
          </Link>
        </div>
        <ul className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {BRAND_STORY_LIST.map((story) => (
            <li key={story.path}>
              <Link
                to={story.path}
                className="block h-full rounded-2xl bg-white border border-[#e7e0d4] p-5 hover:border-[#D97706]/50 hover:shadow-md transition-all"
              >
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#D97706] mb-2">
                  {story.kicker}
                </p>
                <p className="font-serif text-xl text-[#1E3A8A] leading-snug">{story.slogan}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HomeHeroSlogans;
