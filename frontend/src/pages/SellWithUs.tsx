import { useState } from 'react';
import { Store, TrendingUp, Globe2, Users, ShieldCheck, Package, CheckCircle, ArrowRight, Mail, Building2, Tag, ExternalLink } from 'lucide-react';
import SEO from '@/components/SEO';
import api from '@/services/api';

const PRODUCT_CATEGORIES = [
  'Dog Food & Treats',
  'Cat Food & Treats',
  'Bird Food & Supplies',
  'Fish & Aquarium',
  'Reptile Supplies',
  'Small Pet Supplies',
  'Pet Toys',
  'Grooming & Hygiene',
  'Health & Wellness',
  'Beds & Furniture',
  'Leashes, Collars & Harnesses',
  'Other Pet Products',
];

const BENEFITS = [
  {
    icon: Globe2,
    title: 'Reach 1.1M NYC Pet Households',
    desc: 'New York City has one of the densest concentrations of pet owners in the US. Your products go in front of engaged buyers across all five boroughs.',
  },
  {
    icon: TrendingUp,
    title: 'Growing Platform',
    desc: 'PetShiwu is scaling fast with 10,000+ products, active SEO, Google Shopping integration, and a customer base of NYC pet parents actively searching and buying.',
  },
  {
    icon: Users,
    title: 'Dedicated Customer Base',
    desc: 'Our customers are repeat buyers — pet food and supplies are purchased monthly. Your brand gets recurring exposure to loyal, high-intent shoppers.',
  },
  {
    icon: Package,
    title: 'All Pet Categories Welcome',
    desc: 'Dogs, cats, birds, fish, reptiles, small animals — we cover every pet type. Whether you make premium kibble or specialty reptile supplements, there\'s a place for you here.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent Partnership',
    desc: 'No hidden fees or surprises. We\'ll discuss terms clearly upfront — whether that\'s wholesale, consignment, dropship, or a custom arrangement that works for both sides.',
  },
  {
    icon: Store,
    title: 'Simple Onboarding',
    desc: 'Send us your product catalog and we handle the listing, photography optimization, SEO copy, and placement. You focus on your product; we handle the storefront.',
  },
];

const HOW = [
  { step: '1', title: 'Apply', desc: 'Fill out the form below with your brand, product category, and what you\'re looking to sell. No commitment required.' },
  { step: '2', title: 'Review', desc: 'Our team reviews your application within 2–3 business days and reaches out to discuss fit, terms, and next steps.' },
  { step: '3', title: 'List', desc: 'Once approved, we onboard your products — catalog upload, images, descriptions, pricing. You\'re live on PetShiwu.' },
  { step: '4', title: 'Sell', desc: 'Your products reach NYC pet owners searching daily. We handle the storefront, orders, and customer service.' },
];

const SellWithUs = () => {
  const [form, setForm] = useState({ name: '', email: '', company: '', website: '', productCategory: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/v1/contact/vendor', form);
      setSubmitted(true);
    } catch {
      setError('Failed to send. Please email us directly at support@petshiwu.com');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Sell Your Pet Products on PetShiwu | Vendor & Brand Partnerships"
        description="Sell your pet products on PetShiwu and reach 1.1 million NYC pet households. We welcome brands, manufacturers, and suppliers across all pet categories. Apply today."
        keywords="sell pet products online, pet supplier partnership, pet brand marketplace, NYC pet store vendor, sell on petshiwu"
        url="/sell-with-us"
      />

      <div className="bg-gray-50 min-h-screen">

        {/* Hero */}
        <section className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] text-white py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide mb-5 uppercase">
                  Vendor &amp; Brand Partnerships
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-5">
                  Sell Your Products on PetShiwu
                </h1>
                <p className="text-lg text-blue-100 max-w-lg mb-6">
                  Get your pet products in front of millions of NYC pet owners.
                  We're actively partnering with brands, manufacturers, and suppliers
                  across every pet category.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="#apply"
                    className="inline-flex items-center gap-2 bg-white text-blue-800 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="mailto:support@petshiwu.com"
                    className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <Mail className="w-4 h-4" /> support@petshiwu.com
                  </a>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8">
                <h2 className="text-xl font-bold mb-6 text-white">Who We're Looking For</h2>
                <div className="space-y-3">
                  {[
                    'Pet food brands — dry, wet, raw, freeze-dried',
                    'Treat and supplement manufacturers',
                    'Toy, accessory, and lifestyle brands',
                    'Grooming and hygiene product companies',
                    'Bird, fish, reptile, and small pet specialists',
                    'Health and wellness pet product makers',
                    'International brands expanding into the US market',
                    'Local NYC/NY brands wanting wider reach',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      <span className="text-blue-100 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">Why Partner With Us</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What You Get</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                PetShiwu gives your brand direct access to one of the most concentrated pet owner markets in North America.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-700" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white border-y border-gray-100 py-14">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">The Process</p>
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {HOW.map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4">
                    {step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section id="apply" className="py-16 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">Apply Today</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Brand &amp; Vendor Application</h2>
                <p className="text-gray-600">
                  Tell us about your brand and products. Our partnerships team will be in touch within 2–3 business days.
                </p>
              </div>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Application Received!</h3>
                  <p className="text-gray-600">
                    Thank you for your interest in partnering with PetShiwu. Our team will review your application
                    and be in touch within 2–3 business days.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          placeholder="Jane Smith"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          placeholder="you@yourcompany.com"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Brand / Company Name *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.company}
                        onChange={e => setForm({ ...form, company: e.target.value })}
                        placeholder="Acme Pet Foods Inc."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-1.5"><ExternalLink className="w-4 h-4" /> Website</span>
                      </label>
                      <input
                        type="url"
                        value={form.website}
                        onChange={e => setForm({ ...form, website: e.target.value })}
                        placeholder="https://yourcompany.com"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> Primary Product Category</span>
                      </label>
                      <select
                        value={form.productCategory}
                        onChange={e => setForm({ ...form, productCategory: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select a category (optional)</option>
                        {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tell Us About Your Products *</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        placeholder="Describe your products, how many SKUs you have, pricing range, and anything else you'd like us to know..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
                    >
                      {loading ? 'Submitting...' : (
                        <><Store className="w-4 h-4" /> Submit Application</>
                      )}
                    </button>
                  </form>
                </div>
              )}

              <p className="text-center text-sm text-gray-500 mt-4">
                Questions? Email us at{' '}
                <a href="mailto:support@petshiwu.com" className="text-blue-700 hover:underline font-medium">
                  support@petshiwu.com
                </a>
              </p>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default SellWithUs;
