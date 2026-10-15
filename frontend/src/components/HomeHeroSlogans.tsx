import { Link } from 'react-router-dom';
import {
  HOME_HERO_IMAGE,
  HOME_HERO_IMAGE_JPG,
  HOME_HERO_IMAGE_WIDE,
  HOME_HERO_IMAGE_WIDE_JPG,
  HOME_PROMO_TILES,
  HOME_SLOGAN_SUPPORT,
} from '@/data/brandStories';
import { FIRST_ORDER_CODE } from '@/config/publicPromos';
import { HERO_H1 } from '@/utils/deliveryZones';

const HomeHeroSlogans = () => {
  return (
    <section className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-3">
        <div className="grid lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 rounded-2xl bg-[#1E3A8A] overflow-hidden grid sm:grid-cols-5 min-h-[168px]">
            <div className="order-2 sm:order-1 sm:col-span-3 flex flex-col justify-center px-5 py-5 sm:px-7 text-white">
              <p className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-white/70">
                {FIRST_ORDER_CODE}
              </p>
              <h1 className="mt-1.5 text-3xl sm:text-4xl font-extrabold leading-[0.95] tracking-tight">
                {HERO_H1}
              </h1>
              <p className="mt-2 text-sm text-white/80 max-w-xs">{HOME_SLOGAN_SUPPORT}</p>
              <div className="mt-4">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-white text-[#1E3A8A] text-sm font-semibold shadow-sm hover:bg-slate-100 transition-colors"
                >
                  Shop now
                </Link>
              </div>
            </div>
            <div className="order-1 sm:order-2 sm:col-span-2 relative h-28 sm:h-auto bg-[#163074]">
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

          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {HOME_PROMO_TILES.map((tile) => (
              <Link
                key={tile.title}
                to={tile.to}
                className="group relative rounded-2xl overflow-hidden min-h-[132px] sm:min-h-[168px] bg-[#1E3A8A]"
              >
                <picture>
                  <source srcSet={tile.image} type="image/webp" />
                  <img
                    src={tile.imageJpg}
                    alt={tile.imageAlt}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F4D]/90 via-[#1E3A8A]/35 to-transparent" />
                <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end text-white">
                  <h2 className="text-lg sm:text-xl font-extrabold leading-tight">{tile.title}</h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-white/85">{tile.text}</p>
                  <span className="mt-2 inline-flex items-center justify-center h-8 px-3 rounded-full bg-white text-[#1E3A8A] text-xs font-semibold w-fit">
                    {tile.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSlogans;
