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
    <section className="bg-[#F7F6F3] border-b border-stone-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="max-w-xl">
            <p className="text-xs font-medium tracking-[0.16em] uppercase text-stone-500">
              Nationwide pet delivery
            </p>
            <h1 className="mt-3 text-[1.65rem] sm:text-[2rem] font-medium leading-[1.2] tracking-[-0.02em] text-stone-900">
              {HERO_H1}
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-stone-600">{HOME_SLOGAN_SUPPORT}</p>
            <div className="mt-7">
              <Link to="/products" className="btn btn-primary">
                Shop now
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200">
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

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
          {HOME_PROMO_TILES.map((tile) => (
            <Link
              key={tile.title}
              to={tile.to}
              className="group relative min-h-[140px] overflow-hidden rounded-2xl bg-stone-200 sm:min-h-[180px]"
            >
              <picture>
                <source srcSet={tile.image} type="image/webp" />
                <img
                  src={tile.imageJpg}
                  alt={tile.imageAlt}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
                <h2 className="text-base font-medium sm:text-lg">{tile.title}</h2>
                <p className="mt-1 text-xs text-white/85 sm:text-sm">{tile.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSlogans;
