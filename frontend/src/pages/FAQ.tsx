import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { faqService } from '@/services/faqs';
import type { FAQ } from '@/services/faqs';
import LoadingSpinner from '@/components/LoadingSpinner';
import { HelpCircle, Search, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Mail, Clock } from 'lucide-react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());

  // Fetch FAQs
  const { data: faqs, isLoading: faqsLoading } = useQuery({
    queryKey: ['faqs', selectedCategory, searchQuery],
    queryFn: () => faqService.getFAQs({
      category: selectedCategory || undefined,
      search: searchQuery || undefined
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000 // 15 minutes
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['faq-categories'],
    queryFn: faqService.getFAQCategories,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000 // 24 hours
  });

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });
  };

  const handleMarkHelpful = async (faqId: string) => {
    try {
      await faqService.markHelpful(faqId);
    } catch (error) {
      console.error('Failed to mark FAQ as helpful:', error);
    }
  };

  const handleMarkNotHelpful = async (faqId: string) => {
    try {
      await faqService.markNotHelpful(faqId);
    } catch (error) {
      console.error('Failed to mark FAQ as not helpful:', error);
    }
  };

  // Group FAQs by category
  const faqsByCategory = faqs?.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>) || {};

  const allCategories = categories || [];

  if (faqsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Generate structured data for SEO (FAQPage schema)
  const faqStructuredData = useMemo(() => {
    if (!faqs || faqs.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }, [faqs]);

  // Enhanced SEO description
  const seoDescription = useMemo(() => {
    const totalFAQs = faqs?.length || 0;
    const categories = Object.keys(faqsByCategory).length;
    return `Get answers to ${totalFAQs}+ frequently asked questions about pet products, shipping, returns, orders, payment, and more. Browse ${categories} categories of FAQs to find what you need at PetShiwu.`;
  }, [faqs, faqsByCategory]);

  return (
    <>
      <SEO
        title="Frequently Asked Questions (FAQ) | PetShiwu - Pet Products Help Center"
        description={seoDescription}
        keywords="FAQ, frequently asked questions, pet store help, shipping questions, return policy, order tracking, pet product questions, customer support, pet care help, online pet store FAQ"
      />
      
      {/* Structured Data for SEO */}
      {faqStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
      )}
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle size={48} className="text-primary-600" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Frequently Asked Questions
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
              Find answers to common questions about our products, shipping, returns, orders, payment, and more.
            </p>
            {faqs && faqs.length > 0 && (
              <p className="text-sm text-gray-500">
                {faqs.length} questions across {Object.keys(faqsByCategory).length} categories
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/return-policy"
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Return Policy</span>
              </Link>
              <Link
                to="/products"
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Browse Products</span>
              </Link>
              <a
                href="mailto:support@petshiwu.com"
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <Mail className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Contact Support</span>
              </a>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Mon-Fri, 9AM-6PM EST</span>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="md:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {allCategories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* FAQs by Category */}
          {Object.keys(faqsByCategory).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <HelpCircle size={64} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No FAQs Found</h2>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'No FAQs available in this category'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@petshiwu.com"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Contact Support
                </a>
                <Link
                  to="/return-policy"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  View Return Policy
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(faqsByCategory).map(([category, categoryFAQs]) => (
                <article key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-primary-600 text-white px-6 py-4">
                    <h2 className="text-2xl font-bold">{category}</h2>
                    <p className="text-primary-100 text-sm mt-1">
                      {categoryFAQs.length} question{categoryFAQs.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {categoryFAQs.map((faq) => {
                      const isExpanded = expandedFAQs.has(faq._id);
                      return (
                        <div key={faq._id} className="p-6" itemScope itemType="https://schema.org/Question">
                          <button
                            onClick={() => toggleFAQ(faq._id)}
                            className="w-full flex items-start justify-between text-left group"
                            aria-expanded={isExpanded}
                            aria-controls={`faq-answer-${faq._id}`}
                          >
                            <h3 className="text-lg font-semibold text-gray-900 pr-4 group-hover:text-primary-600 transition-colors" itemProp="name">
                              {faq.question}
                            </h3>
                            {isExpanded ? (
                              <ChevronUp size={24} className="text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown size={24} className="text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                          {isExpanded && (
                            <div id={`faq-answer-${faq._id}`} className="mt-4 space-y-4" itemScope itemType="https://schema.org/Answer">
                              <div className="prose max-w-none text-gray-700">
                                <p className="whitespace-pre-line" itemProp="text">{faq.answer}</p>
                              </div>
                              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                <span className="text-sm text-gray-500">
                                  Was this helpful?
                                </span>
                                <button
                                  onClick={() => handleMarkHelpful(faq._id)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                  <ThumbsUp size={18} />
                                  <span className="text-sm">Yes</span>
                                  {faq.helpfulCount > 0 && (
                                    <span className="text-xs text-gray-500">({faq.helpfulCount})</span>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleMarkNotHelpful(faq._id)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                  <ThumbsDown size={18} />
                                  <span className="text-sm">No</span>
                                  {faq.notHelpfulCount > 0 && (
                                    <span className="text-xs text-gray-500">({faq.notHelpfulCount})</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
              <p className="text-gray-700 mb-6">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help you with any questions about our products, orders, or services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@petshiwu.com"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  <Mail className="w-5 h-5" />
                  Email Support
                </a>
                <Link
                  to="/return-policy"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-semibold"
                >
                  View Return Policy
                </Link>
              </div>
              <p className="text-sm text-gray-600 mt-4 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Support Hours: Monday–Friday, 9 AM–6 PM (EST)
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;

