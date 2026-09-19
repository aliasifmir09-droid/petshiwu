import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Home } from 'lucide-react';
import { productService } from '@/services/products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { NATIONWIDE_SOON_NOTE } from '@/data/brandStories';
import {
  BRAND_INDEX_META,
  FOOTER_SHOP_BRANDS,
  getShopBrand,
  HOME_STRIP_BRANDS,
  SHOP_BRANDS,
  type ShopBrand,
} from '@/data/shopBrands';
import { generateProductUrl } from '@/utils/productUrl';
import NotFound from './NotFound';

const BrandLogoTile = ({ brand }: { brand: ShopBrand }) => (
  <div
    className={`w-full h-24 flex items-center justify-center rounded-2xl border border-slate-200 overflow-hidden ${
      brand.dark ? 'bg-zinc-900' : 'bg-white'
    }`}
  >
    {brand.logo ? (
      <img
        src={brand.logo}
        alt={`${brand.name} official logo`}
        className="max-h-[4.5rem] max-w-[8rem] w-auto h-auto object-contain p-2"
        loading="lazy"
        onError={(event) => {
          const target = event.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.style.background = '#f8fafc';
            parent.innerHTML = `<span style="font-weight:800;font-size:14px;text-align:center;color:#1E3A8A;padding:8px;line-height:1.3">${brand.name}</span>`;
          }
        }}
      />
    ) : (
      <span className="font-extrabold text-sm text-center text-[#1E3A8A] px-3 leading-tight">
        {brand.name}
      </span>
    )}
  </div>
);

const BrandIndex = () => (
  <>
    <SEO
      title={BRAND_INDEX_META.title}
      description={BRAND_INDEX_META.description}
      keywords={SHOP_BRANDS.map((brand) => brand.name).join(', ')}
      url="https://www.petshiwu.com/brand"
      type="website"
    />
    <StructuredData
      type="itemList"
      data={{
        name: BRAND_INDEX_META.h1,
        numberOfItems: SHOP_BRANDS.length,
        itemListElement: SHOP_BRANDS.map((brand, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `https://www.petshiwu.com/brand/${brand.slug}`,
          name: brand.name,
        })),
      }}
    />
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li className="flex items-center">
            <Link to="/" className="hover:text-primary-600 transition-colors flex items-center gap-1">
              <Home size={16} />
              Home
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            <span className="font-medium text-gray-900">Brands</span>
          </li>
        </ol>
      </nav>
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">{BRAND_INDEX_META.h1}</h1>
      <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mb-4">{BRAND_INDEX_META.intro}</p>
      <p className="text-[#1E3A8A] font-semibold mb-10">{NATIONWIDE_SOON_NOTE}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {SHOP_BRANDS.map((brand) => (
          <Link
            key={brand.slug}
            to={`/brand/${brand.slug}`}
            className="group rounded-2xl p-3 hover:bg-slate-50 transition-colors"
            aria-label={`Shop ${brand.name} products`}
          >
            <BrandLogoTile brand={brand} />
            <p className="text-center text-sm font-semibold text-gray-700 mt-3 group-hover:text-[#1E3A8A]">
              {brand.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  </>
);

const BrandCollection = ({ brand }: { brand: ShopBrand }) => {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10) || 1;
  const hasQueryVariant = searchParams.toString().length > 0;
  const related = (brand.relatedSlugs || [])
    .map((slug) => getShopBrand(slug))
    .filter((item): item is ShopBrand => Boolean(item));

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'brand-page', brand.query, page],
    queryFn: () =>
      productService.getProducts({
        brand: brand.query,
        page,
        limit: 24,
        inStock: true,
        sort: 'rating',
      }),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const products = data?.data || [];
  const pages = data?.pagination?.pages || 1;

  const itemList = useMemo(
    () => ({
      name: brand.h1,
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://www.petshiwu.com${generateProductUrl(product)}`,
        name: product.name,
      })),
    }),
    [brand.h1, products]
  );

  const faqItems = [
    {
      question: `Does Petshiwu sell ${brand.name}?`,
      answer: `Yes. This page is the shoppable ${brand.name} collection at Petshiwu. Products shown are in stock from the live catalog.`,
    },
    {
      question: `Is ${brand.name} on autoship?`,
      answer: 'No. Buy once. We never charge in the background. RESTOCK5 is 10% off, max $10, when you reorder.',
    },
    {
      question: `Can I get ${brand.name} delivered today?`,
      answer:
        'Same-day is NYC (five boroughs) when you order by cutoff. Next-day covers ZIPs within 50 miles of Queens. Nationwide shipping soon.',
    },
  ];

  return (
    <>
      <SEO
        title={brand.title}
        description={brand.description}
        keywords={`${brand.name}, ${brand.name} pet food, ${brand.name} in stock`}
        url={`https://www.petshiwu.com/brand/${brand.slug}`}
        type="website"
        noindex={hasQueryVariant}
      />
      <StructuredData type="itemList" data={itemList} />
      <StructuredData
        type="faq"
        data={faqItems.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        }))}
      />
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li className="flex items-center">
              <Link to="/" className="hover:text-primary-600 transition-colors flex items-center gap-1">
                <Home size={16} />
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight size={16} className="mx-2 text-gray-400" />
              <Link to="/brand" className="hover:text-primary-600 transition-colors">
                Brands
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight size={16} className="mx-2 text-gray-400" />
              <span className="font-medium text-gray-900">{brand.name}</span>
            </li>
          </ol>
        </nav>

        <div className="mb-10 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">{brand.h1}</h1>
          <p className="text-xl text-gray-700 leading-relaxed mb-3">{brand.intro}</p>
          <p className="text-[#1E3A8A] font-semibold">
            In stock. Free shipping over $49. {NATIONWIDE_SOON_NOTE}
          </p>
        </div>

        <div id="in-stock" className="mb-12 scroll-mt-24">
          {isLoading ? (
            <>
              <h2 className="text-3xl font-bold mb-2 text-gray-900">In stock now</h2>
              <LoadingSpinner size="lg" />
            </>
          ) : products.length > 0 ? (
            <>
              <h2 className="text-3xl font-bold mb-2 text-gray-900">In stock now</h2>
              <p className="text-slate-600 mb-6">
                Live {brand.name} catalog. Same products Google can index on this URL.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              {pages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8">
                  {page > 1 && (
                    <Link
                      to={page === 2 ? `/brand/${brand.slug}` : `?page=${page - 1}`}
                      className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="text-sm text-gray-600">
                    Page {page} of {pages}
                  </span>
                  {page < pages && (
                    <Link
                      to={`?page=${page + 1}`}
                      className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Browse the full catalog for {brand.name} and similar brands.</p>
              <Link
                to="/products"
                className="inline-block bg-[#1E3A8A] text-white px-6 py-3 rounded-lg hover:bg-[#1e40af] transition-colors"
              >
                Browse all products
              </Link>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1E3A8A] mb-4">Related brands</h2>
            <div className="flex flex-wrap gap-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/brand/${item.slug}`}
                  className="px-4 py-2 rounded-full border border-[#1E3A8A]/20 text-[#1E3A8A] font-semibold hover:bg-blue-50"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#1E3A8A] mb-3">Nationwide shipping soon</h2>
          <p className="text-slate-700 leading-relaxed">
            {NATIONWIDE_SOON_NOTE} Free shipping over $49. No autoship. Jackson Heights is warehouse and office, not a walk-in store.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqItems.map((faq) => (
              <div key={faq.question} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{faq.question}</h3>
                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h2 className="text-2xl font-bold text-[#1E3A8A] mb-4">Shop more brands</h2>
          <div className="flex flex-wrap gap-3">
            {(related.length > 0 ? FOOTER_SHOP_BRANDS : HOME_STRIP_BRANDS)
              .filter((item) => item.slug !== brand.slug)
              .slice(0, 8)
              .map((item) => (
                <Link
                  key={item.slug}
                  to={`/brand/${item.slug}`}
                  className="text-sm font-semibold text-[#1E3A8A] hover:underline"
                >
                  {item.name}
                </Link>
              ))}
            <Link to="/brand" className="text-sm font-semibold text-[#1E3A8A] hover:underline">
              All brands
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

const Brand = () => {
  const { slug } = useParams<{ slug?: string }>();
  if (!slug) return <BrandIndex />;
  const brand = getShopBrand(slug);
  if (!brand) return <NotFound />;
  return <BrandCollection brand={brand} />;
};

export default Brand;
