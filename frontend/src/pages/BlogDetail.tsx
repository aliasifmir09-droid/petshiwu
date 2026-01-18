import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { blogService } from '@/services/blogs';
import { Calendar, User, Eye, ArrowLeft, Tag } from 'lucide-react';
import DOMPurify from 'dompurify';
import { normalizeBlogContent } from '@/utils/htmlUtils';
import { useMemo } from 'react';

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: blog, isLoading, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => blogService.getBlog(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Extract headings for table of contents
  const { tableOfContents, contentWithIds } = useMemo(() => {
    if (!blog?.content) return { tableOfContents: [], contentWithIds: blog?.content || '' };
    
    const normalized = normalizeBlogContent(blog.content);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = normalized;
    
    const headings = Array.from(tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const toc = headings.map((heading, index) => {
      const id = `heading-${index}-${heading.textContent?.slice(0, 20).toLowerCase().replace(/[^a-z0-9]+/g, '-') || index}`;
      heading.id = id;
      return {
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1))
      };
    });
    
    return {
      tableOfContents: toc,
      contentWithIds: tempDiv.innerHTML
    };
  }, [blog?.content]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist.</p>
          <Link
            to="/learning"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Learning Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Red border at top */}
      <div className="h-1 bg-red-600"></div>
      
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2">
            {/* Header */}
            <header className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {blog.title}
              </h1>
              
              {/* Meta Information */}
              {(blog.author?.name || blog.publishedAt || blog.views) && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                  {blog.author?.name && (
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      <span>{blog.author.name}</span>
                    </div>
                  )}
                  {blog.publishedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                    </div>
                  )}
                  {blog.views !== undefined && (
                    <div className="flex items-center gap-2">
                      <Eye size={14} />
                      <span>{blog.views || 0} views</span>
                    </div>
                  )}
                </div>
              )}
            </header>

            {/* Featured Image */}
            {blog.featuredImage && (
              <div className="mb-10">
                <img
                  src={blog.featuredImage}
                  alt={blog.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Excerpt */}
            {blog.excerpt && (
              <div className="mb-10">
                <p className="text-lg text-gray-700 leading-relaxed">{blog.excerpt}</p>
              </div>
            )}

            {/* Content */}
            <div className="blog-content-wrapper mb-10">
              <div
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(contentWithIds || '', {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 'colspan', 'rowspan', 'align', 'id'],
                    ALLOW_DATA_ATTR: false,
                    KEEP_CONTENT: true
                  })
                }}
                className="blog-content"
              />
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-10 pt-8 border-t border-gray-200">
                <Tag size={16} className="text-gray-400" />
                {blog.tags.map((tag, index) => (
                  <Link
                    key={index}
                    to={`/learning?search=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="pt-8 border-t border-gray-200">
              <Link
                to="/learning"
                className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors text-sm"
              >
                <ArrowLeft size={16} />
                <span>Back to Learning Center</span>
              </Link>
            </div>
          </article>

          {/* Sidebar - Table of Contents */}
          <aside className="lg:col-span-1">
            {tableOfContents.length > 0 && (
              <div className="sticky top-8 bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">In this article</h3>
                <nav className="space-y-2">
                  {tableOfContents.map((item, index) => (
                    <a
                      key={index}
                      href={`#${item.id}`}
                      className={`block text-sm text-gray-700 hover:text-gray-900 transition-colors ${
                        item.level === 1 ? 'font-semibold' : item.level === 2 ? 'ml-4' : 'ml-8'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById(item.id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          // Update URL without scrolling
                          window.history.pushState(null, '', `#${item.id}`);
                        }
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Red border at bottom */}
      <div className="h-1 bg-red-600 mt-12"></div>

      {/* Custom styles for blog content */}
      <style>{`
        .blog-content-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }
        .blog-content {
          line-height: 1.8;
          color: #1f2937;
          font-size: 1rem;
        }
        .blog-content > *:first-child {
          margin-top: 0 !important;
        }
        .blog-content > *:last-child {
          margin-bottom: 0 !important;
        }
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: #111827;
          line-height: 1.3;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        .blog-content h1 { 
          font-size: 2rem;
          margin-top: 3rem;
          margin-bottom: 1.25rem;
        }
        .blog-content h2 { 
          font-size: 1.75rem;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }
        .blog-content h3 { 
          font-size: 1.5rem;
          margin-top: 2rem;
          margin-bottom: 0.875rem;
        }
        .blog-content h4 { 
          font-size: 1.25rem;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
        }
        .blog-content h5,
        .blog-content h6 {
          font-size: 1.125rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .blog-content p {
          margin-bottom: 1.25rem;
          line-height: 1.8;
          color: #1f2937;
          font-size: 1rem;
        }
        .blog-content p:empty {
          display: none;
        }
        .blog-content div {
          margin-bottom: 1.25rem;
          line-height: 1.8;
        }
        .blog-content div:empty {
          display: none;
        }
        .blog-content ul,
        .blog-content ol {
          margin-bottom: 1.5rem;
          margin-top: 1rem;
          padding-left: 2rem;
          line-height: 1.8;
        }
        .blog-content li {
          margin-bottom: 0.5rem;
          line-height: 1.8;
          color: #1f2937;
        }
        .blog-content li:last-child {
          margin-bottom: 0;
        }
        .blog-content img {
          max-width: 100%;
          height: auto;
          margin: 2rem 0;
          display: block;
        }
        .blog-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .blog-content a:hover {
          color: #1d4ed8;
        }
        .blog-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding: 1rem 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: #4b5563;
          background-color: #f9fafb;
        }
        .blog-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          color: #dc2626;
        }
        .blog-content pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1.5rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 2rem 0;
          line-height: 1.6;
        }
        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        .blog-content table {
          width: 100%;
          margin: 2rem 0;
          border-collapse: collapse;
        }
        .blog-content table th,
        .blog-content table td {
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          text-align: left;
        }
        .blog-content table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        .blog-content hr {
          margin: 2rem 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }
        .blog-content strong,
        .blog-content b {
          font-weight: 700;
          color: #111827;
        }
        .blog-content em,
        .blog-content i {
          font-style: italic;
        }
        .blog-content u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default BlogDetail;

