import { Link } from 'react-router-dom';
import SEO from './SEO';
import StructuredData from './StructuredData';
import { Calendar, User, Clock, Tag, ChevronRight, Home } from 'lucide-react';

interface BlogPostTemplateProps {
  title: string;
  description: string;
  content: React.ReactNode;
  author?: string;
  publishDate: string;
  readTime?: number;
  tags?: string[];
  keywords: string[];
  category?: string;
  relatedPosts?: Array<{ title: string; slug: string; excerpt?: string }>;
  breadcrumbs?: Array<{ label: string; path: string }>;
}

/**
 * Blog Post Template Component
 * Reusable template for SEO-optimized blog posts
 * Includes structured data, breadcrumbs, and related content
 */
const BlogPostTemplate = ({
  title,
  description,
  content,
  author = 'PetShiwu Team',
  publishDate,
  readTime = 5,
  tags = [],
  keywords,
  category,
  relatedPosts = [],
  breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Learning', path: '/learning' }
  ]
}: BlogPostTemplateProps) => {
  const canonicalUrl = `https://www.petshiwu.com/learning/${title.toLowerCase().replace(/\s+/g, '-')}`;

  // Generate article schema
  const articleSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Article',
    headline: title,
    description: description,
    author: {
      '@type': 'Organization',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: 'PetShiwu',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.petshiwu.com/logo.png'
      }
    },
    datePublished: publishDate,
    dateModified: publishDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    }
  };

  return (
    <>
      <SEO
        title={`${title} | PetShiwu`}
        description={description}
        keywords={keywords.join(', ')}
        url={canonicalUrl}
        type="article"
        author={author}
        publishedTime={publishDate}
        category={category}
      />
      <StructuredData type="review" data={articleSchema} />

      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.path} className="flex items-center">
                {index > 0 && <ChevronRight size={16} className="mx-2 text-gray-400" />}
                {index === 0 ? (
                  <Link to={crumb.path} className="hover:text-primary-600 transition-colors flex items-center gap-1">
                    <Home size={16} />
                    {crumb.label}
                  </Link>
                ) : crumb.path ? (
                  <Link to={crumb.path} className="hover:text-primary-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <article className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            {category && (
              <span className="inline-block bg-primary-100 text-primary-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                {category}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>{author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <time dateTime={publishDate}>
                  {new Date(publishDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{readTime} min read</span>
              </div>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/learning?tag=${tag.toLowerCase().replace(/\s+/g, '-')}`}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Tag size={14} />
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            {content}
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <aside className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/learning/${post.slug}`}
                    className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-600">{post.excerpt}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-primary-600 mt-3 font-medium">
                      Read more
                      <ChevronRight size={16} />
                    </span>
                  </Link>
                ))}
              </div>
            </aside>
          )}

          {/* CTA Section */}
          <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Find the Perfect Products for Your Pet
            </h2>
            <p className="text-gray-700 mb-6">
              Browse our premium selection of pet food, toys, and supplies.
            </p>
            <Link
              to="/products"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Shop Now
            </Link>
          </div>
        </article>
      </div>
    </>
  );
};

export default BlogPostTemplate;

