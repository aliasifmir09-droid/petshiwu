import { Link } from 'react-router-dom';
import {
  HOME_HERO_IMAGE,
  HOME_HERO_IMAGE_JPG,
  HOME_HERO_IMAGE_WIDE,
  HOME_HERO_IMAGE_WIDE_JPG,
  HOME_PROMO_TILES,
  HOME_SLOGAN_SUPPORT,
} from '@/data/brandStories';
import { HERO_H1 } from '@/utils/deliveryZones';

const HomeHeroSlogans = () => {
  return (
    <section
      className="border-b border-orange-100 bg-gradient-to-b from-[#FFF4E0] via-[#FAF6EF] to-white"
      data-home-section="hero"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-orange">Nationwide pet delivery</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] text-[#1E3A8A] md:text-5xl">{HERO_H1}</h1>
            <p className="mt-4 text-base leading-relaxed text-slate-700">{HOME_SLOGAN_SUPPORT}</p>
            <div className="mt-8">
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-full bg-brand-orange px-8 py-3.5 font-bold text-white shadow-md hover:bg-brand-orange-dark"
              >
                Shop now
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 shadow-md">
            <picture>
              <source media="(min-width: 768px)" srcSet={HOME_HERO_IMAGE} type="image/webp" />
              <source media="(min-width: 768px)" srcSet={HOME_HERO_IMAGE_JPG} />
              <source srcSet={HOME_HERO_IMAGE_WIDE} type="image/webp" />
              <img
                src={HOME_HERO_IMAGE_WIDE_JPG}
                alt="Dog, cat, and macaw with Petshiwü food and bags"
                className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
              />
            </picture>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4">
          {HOME_PROMO_TILES.map((tile) => (
            <Link
              key={tile.title}
              to={tile.to}
              className="group relative min-h-[148px] overflow-hidden rounded-2xl bg-slate-200 shadow-sm sm:min-h-[200px]"
            >
              <picture>
                <source srcSet={tile.image} type="image/webp" />
                <img
                  src={tile.imageJpg}
                  alt={tile.imageAlt}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/85 via-[#1E3A8A]/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                <h2 className="text-base font-bold sm:text-lg">{tile.title}</h2>
                <p className="mt-1 text-xs text-white/90 sm:text-sm">{tile.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSlogans;
