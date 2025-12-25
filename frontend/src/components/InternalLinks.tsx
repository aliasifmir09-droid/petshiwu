/**
 * Internal Links Component
 * Displays contextual internal links for better SEO and user navigation
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { generateInternalLinks, type InternalLink } from '@/utils/seoUtils';

interface InternalLinksProps {
  category?: string;
  petType?: string;
  relatedProducts?: Array<{ name: string; slug: string }>;
  className?: string;
}

const InternalLinks = ({
  category,
  petType,
  relatedProducts,
  className = ''
}: InternalLinksProps) => {
  const links = generateInternalLinks(category, petType, relatedProducts);

  if (links.length === 0) {
    return null;
  }

  return (
    <nav
      className={`bg-gray-50 rounded-lg p-6 ${className}`}
      aria-label="Related pages"
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Explore More
      </h2>
      <ul className="space-y-3">
        {links.map((link, index) => (
          <li key={index}>
            <Link
              to={link.url}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              <ChevronRight size={16} className="flex-shrink-0" />
              <span className="font-medium">{link.text}</span>
            </Link>
            {link.description && (
              <p className="text-sm text-gray-600 ml-6 mt-1">
                {link.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default InternalLinks;

