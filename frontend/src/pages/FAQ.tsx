import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { faqService } from '@/services/faqs';
import type { FAQ } from '@/services/faqs';
import LoadingSpinner from '@/components/LoadingSpinner';
import { HelpCircle, Search, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react';
import SEO from '@/components/SEO';

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

  return (
    <>
      <SEO
        title="Frequently Asked Questions (FAQ) | petshiwu"
        description="Find answers to common questions about our products, shipping, returns, orders, and more."
        keywords="FAQ, frequently asked questions, help, support, shipping, returns, orders"
      />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle size={48} className="text-primary-600" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Frequently Asked Questions
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our products, shipping, returns, and more.
            </p>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs Found</h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'No FAQs available in this category'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(faqsByCategory).map(([category, categoryFAQs]) => (
                <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
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
                        <div key={faq._id} className="p-6">
                          <button
                            onClick={() => toggleFAQ(faq._id)}
                            className="w-full flex items-start justify-between text-left group"
                          >
                            <h3 className="text-lg font-semibold text-gray-900 pr-4 group-hover:text-primary-600 transition-colors">
                              {faq.question}
                            </h3>
                            {isExpanded ? (
                              <ChevronUp size={24} className="text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown size={24} className="text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="mt-4 space-y-4">
                              <div className="prose max-w-none text-gray-700">
                                <p className="whitespace-pre-line">{faq.answer}</p>
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
        </div>
      </div>
    </>
  );
};

export default FAQ;

