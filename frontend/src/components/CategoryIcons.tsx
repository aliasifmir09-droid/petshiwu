import { Link } from 'react-router-dom';

const categories = [
  {
    title: 'Dog food',
    link: '/dog/food',
    image: '/category-dog-food.png',
  },
  {
    title: 'Vitamins & supplements',
    link: '/products?vitaminsFilter=true&supplementsFilter=true',
    image: '/category-vitamins-supplements.png',
  },
  {
    title: 'Dog treats',
    link: '/products?petType=dog&search=treats',
    image: '/category-dog-treats.png',
  },
  {
    title: 'Cat food',
    link: '/cat/food',
    image: '/category-cat-food.png',
  },
  {
    title: 'Cat litter',
    link: '/products?petType=cat&search=litter',
    image: '/category-cat-litter.png',
  },
  {
    title: 'Deals',
    link: '/products?featured=true',
    image: '/category-deals.png',
  },
];

const CategoryIcons = () => {
  return (
    <section className="bg-white py-12 md:py-16" data-home-section="essentials">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-orange">Aisles</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[#1E3A8A]">Shop essentials</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">Food, treats, litter, and more — the aisles you already know</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.title}
              to={category.link}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-200 shadow-sm"
            >
              <img
                src={category.image}
                alt={category.title}
                width={240}
                height={300}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/85 via-[#1E3A8A]/25 to-transparent" />
              <p className="absolute inset-x-0 bottom-0 p-3 text-sm font-bold leading-tight text-white sm:text-base">
                {category.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryIcons;
