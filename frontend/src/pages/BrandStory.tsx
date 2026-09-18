import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { BRAND_STORIES, BRAND_STORY_LIST, NATIONWIDE_CHIPS, type BrandStorySlug } from '@/data/brandStories';

type BrandStoryProps = {
  slug: BrandStorySlug;
};

const BrandStory = ({ slug }: BrandStoryProps) => {
  const story = BRAND_STORIES[slug];

  return (
    <div className="bg-white min-h-[70vh]">
      <SEO title={story.title} description={story.description} url={story.path} />
      <section className="grid lg:grid-cols-2 items-stretch border-b border-slate-200">
        <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-14 lg:py-16 bg-white">
          <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 mb-3">{story.kicker}</p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-[#1E3A8A] max-w-xl mb-5">{story.slogan}</h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">{story.intro}</p>
          <Link
            to="/products"
            className="mt-8 inline-flex items-center justify-center h-11 px-7 rounded-md bg-[#1E3A8A] text-white font-semibold hover:bg-[#163074] w-fit"
          >
            {story.ctaLabel}
          </Link>
          <p className="mt-8 text-sm text-slate-500">{NATIONWIDE_CHIPS.join('  ·  ')}</p>
        </div>
        <div className="bg-[#f7f4ee] overflow-hidden">
          <picture>
            <source media="(min-width: 1024px)" srcSet={story.image} type="image/webp" />
            <source media="(min-width: 1024px)" srcSet={story.imageJpg} />
            <source srcSet={story.imageWide} type="image/webp" />
            <img
              src={story.imageWideJpg}
              alt={story.imageAlt}
              className="w-full h-auto object-contain object-center"
            />
          </picture>
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-8">
          {story.sections.map((section) => (
            <article key={section.heading}>
              <h2 className="text-xl font-bold text-[#1E3A8A] mb-3">{section.heading}</h2>
              <p className="text-slate-600 leading-relaxed">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 pb-16">
        <h2 className="text-xs font-semibold tracking-wide uppercase text-slate-500 mb-4">More from Petshiwu</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {BRAND_STORY_LIST.filter((item) => item.slug !== slug).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="border border-slate-200 p-6 hover:border-[#1E3A8A] transition-colors"
            >
              <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 mb-2">{item.kicker}</p>
              <p className="text-lg font-semibold text-slate-900">{item.slogan}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BrandStory;
