import { Link } from 'react-router-dom';
import {
  HOME_HERO_IMAGE,
  HOME_HERO_IMAGE_JPG,
  HOME_HERO_IMAGE_WIDE,
  HOME_HERO_IMAGE_WIDE_JPG,
  HOME_PROMO_TILES,
  HOME_SLOGAN,
  HOME_SLOGAN_SUPPORT,
} from '@/data/brandStories';
import { FIRST_ORDER_CODE } from '@/config/publicPromos';

const HomeHeroSlogans = () => {
  return (
    <section className="bg-[#F7F4EE]">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-5 lg:py-6">
        <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="lg:col-span-2 rounded-[1.75rem] sm:rounded-[2rem] bg-[#1E3A8A] overflow-hidden min-h-[420px] lg:min-h-[540px] grid md:grid-cols-2">
            <div className="order-2 md:order-1 flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-12 text-white">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.22em] uppercase text-white/70">
                {FIRST_ORDER_CODE}
              </p>
              <h1 className="mt-3 text-[2.75rem] sm:text-6xl lg:text-[4.5rem] font-extrabold leading-[0.92] tracking-tight">
                20% off{' '}
                <br />
                first order.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-white/80 max-w-sm">{HOME_SLOGAN_SUPPORT}</p>
              <div className="mt-8">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white text-[#1E3A8A] font-semibold shadow-sm hover:bg-slate-100 transition-colors"
                >
                  Shop now
                </Link>
              </div>
            </div>
            <div className="order-1 md:order-2 relative h-52 sm:h-72 md:h-auto bg-[#163074]">
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            {HOME_PROMO_TILES.map((tile) => (
              <Link
                key={tile.title}
                to={tile.to}
                className="group relative rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden min-h-[180px] lg:min-h-[260px] bg-[#1E3A8A]"
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
                <div className="absolute inset-0 p-6 sm:p-7 flex flex-col justify-end text-white">
                  <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">{tile.title}</h2>
                  <p className="mt-1 text-sm text-white/85">{tile.text}</p>
                  <span className="mt-4 inline-flex items-center justify-center h-10 px-5 rounded-full bg-white text-[#1E3A8A] text-sm font-semibold w-fit">
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
