import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { BRAND_STORIES, BRAND_STORY_LIST, type BrandStorySlug } from '@/data/brandStories';

type BrandStoryProps = {
  slug: BrandStorySlug;
};

const BrandStory = ({ slug }: BrandStoryProps) => {
  const story = BRAND_STORIES[slug];

  return (
    <div className="bg-[#f4f1ea] min-h-[70vh]">
      <SEO title={story.title} description={story.description} url={story.path} />
      <section className="bg-[#1E3A8A] text-white">
        <div className="h-1.5 w-full bg-[#D97706]" />
        <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-amber-200 mb-4">{story.kicker}</p>
          <h1 className="font-serif text-3xl sm:text-5xl leading-tight max-w-4xl mb-5">{story.slogan}</h1>
          <p className="text-base sm:text-lg text-blue-100 max-w-3xl">{story.intro}</p>
          <Link
            to="/products"
            className="mt-8 inline-flex items-center justify-center h-12 px-7 rounded-full bg-amber-300 text-[#0B1F4A] font-bold hover:bg-amber-200"
          >
            {story.ctaLabel}
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-5">
          {story.sections.map((section) => (
            <article key={section.heading} className="bg-white rounded-2xl border border-[#e7e0d4] p-6">
              <h2 className="font-serif text-2xl text-[#1E3A8A] mb-3">{section.heading}</h2>
              <p className="text-[#44403c] leading-relaxed">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 pb-16">
        <h2 className="text-sm font-bold tracking-[0.16em] uppercase text-[#D97706] mb-4">More from Petshiwu</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {BRAND_STORY_LIST.filter((item) => item.slug !== slug).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="rounded-2xl bg-white border border-[#e7e0d4] p-5 hover:border-[#D97706]/50"
            >
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#D97706] mb-2">{item.kicker}</p>
              <p className="font-serif text-xl text-[#1E3A8A]">{item.slogan}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BrandStory;
