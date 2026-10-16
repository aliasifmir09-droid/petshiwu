import { useNavigate } from 'react-router-dom';
import { PET_CATEGORIES } from '@/data/shopByPet';

const ShopByPet = () => {
  const navigate = useNavigate();
  const goToPet = (slug: string) => navigate(`/products?petType=${slug}`);

  return (
    <section className="bg-[#FAF6EF]" data-home-section="shop-by-pet">
      <div className="container mx-auto px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-orange">Pets</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#1E3A8A]">Shop by pet</h2>
          </div>
          <p className="hidden text-sm text-slate-600 sm:block">Dogs, cats, birds, fish, reptiles, and small pets.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PET_CATEGORIES.map((category, index) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => goToPet(category.slug)}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-200 text-left shadow-sm"
            >
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading={index < 2 ? 'eager' : 'lazy'}
                width={240}
                height={300}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/85 via-[#1E3A8A]/20 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-bold text-white sm:text-base">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByPet;
