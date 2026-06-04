import { useState } from 'react';
import { TrendingUp, Users, Globe2, ShieldCheck, Package, DollarSign, CheckCircle, ArrowRight, Mail, Building2 } from 'lucide-react';
import SEO from '@/components/SEO';
import api from '@/services/api';

const INVESTMENT_RANGES = [
  'Under $50,000',
  '$50,000 – $250,000',
  '$250,000 – $1,000,000',
  '$1,000,000 – $5,000,000',
  '$5,000,000+',
  'Prefer not to disclose',
];

const STATS = [
  { label: 'Products', value: '10,000+', icon: Package },
  { label: 'NYC Boroughs Served', value: '5', icon: Globe2 },
  { label: 'US Pet Industry (2025)', value: '$150B+', icon: TrendingUp },
  { label: 'Free Shipping Threshold', value: '$49', icon: DollarSign },
];

const WHY = [
  {
    icon: TrendingUp,
    title: 'Explosive Market Opportunity',
    desc: 'The US pet industry exceeded $150 billion in 2025 and continues growing. Pet humanization trends, NYC\'s 1.1 million pet households, and a shift to online purchasing create a massive, durable opportunity.',
  },
  {
    icon: Globe2,
    title: 'NYC-First, National Vision',
    desc: 'We\'re establishing deep roots in New York City — the most competitive and densely populated US market — before expanding nationwide. Winning NYC is proof of concept for the rest of the country.',
  },
  {
    icon: Users,
    title: 'Underserved Local Market',
    desc: 'NYC pet owners have long been underserved by national retailers not optimized for city living. PetShiwu is purpose-built for the no-car, apartment-dwelling, delivery-dependent New Yorker.',
  },
  {
    icon: Package,
    title: 'Scalable Infrastructure',
    desc: '10,000+ SKUs live on day one. Full e-commerce stack, AI-powered product advisor, real-time inventory, and delivery logistics already operational. Capital goes toward growth, not setup.',
  },
  {
    icon: ShieldCheck,
    title: 'Strong Unit Economics',
    desc: 'Free shipping at $49 drives larger basket sizes. Delivery-only model eliminates retail overhead. Repeat pet food purchases create predictable recurring revenue. High LTV, low churn.',
  },
  {
    icon: DollarSign,
    title: 'Capital-Efficient Model',
    desc: 'We\'re lean by design. No expensive storefronts, no excess inventory risk. Technology-first approach means we scale with software, not headcount.',
  },
];

const Investors = () => {
  const [form, setForm] = useState({ name: '', email: '', company: '', investmentRange: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/v1/contact/investor', form);
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
        title="Investor Relations | PetShiwu"
        description="Invest in PetShiwu — NYC's fastest-growing online pet supply platform. Targeting a $150B+ industry with a delivery-first, technology-driven model serving all five NYC boroughs."
        keywords="petshiwu investor, pet supply startup investment, NYC pet store investment, pet industry investor relations"
        url="/investors"
      />

      <div className="bg-gray-50 min-h-screen">

        {/* Hero */}
        <section className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] text-white py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide mb-5 uppercase">
                  Investor Relations
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-5">
                  Invest in the Future of Pet Commerce
                </h1>
                <p className="text-lg text-blue-100 max-w-lg mb-6">
                  PetShiwu is building the premier online pet supply platform for New York City —
                  and beyond. We're targeting a $150B+ industry with a delivery-first, technology-driven model.
                </p>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 bg-white text-blue-800 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  Get in Touch <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {STATS.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-center">
                    <Icon className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
                    <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
                    <p className="text-blue-200 text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Invest */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">The Opportunity</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why PetShiwu</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                A rare combination of large market, underserved customer base, live operational platform, and a clear path to national scale.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {WHY.map(({ icon: Icon, title, desc }) => (
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

        {/* Traction */}
        <section className="bg-white border-y border-gray-100 py-14">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2 text-center">Current Traction</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">Built and Operating</h2>
              <div className="space-y-3">
                {[
                  '10,000+ live products across all pet categories — dogs, cats, birds, fish, reptiles, small pets',
                  'Full e-commerce platform: cart, checkout, order tracking, customer accounts',
                  'AI-powered product advisor using Google Gemini — personalized per registered user',
                  'Delivery operations covering all 5 NYC boroughs with free shipping over $49',
                  'Bunny CDN global image delivery — 10,039 product images cached worldwide',
                  'Google Search Console indexed — 10,000+ URLs submitted, SEO content live',
                  '226 published SEO blog posts targeting NYC pet owner searches',
                  'Admin dashboard: orders, fulfillment, refunds, tracking — fully operational',
                  'Resend transactional email: order confirmations, birthday promos, customer comms',
                  'Toll-free support line: +1 (800) 259-2605 with IVR and call routing',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-gray-700 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-16 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">Get in Touch</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Investor Inquiry</h2>
                <p className="text-gray-600">
                  Interested in learning more? Send us a note and we'll follow up with our deck and financials.
                </p>
              </div>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Inquiry Received</h3>
                  <p className="text-gray-600">Thank you for your interest. We'll be in touch shortly with more information.</p>
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
                          placeholder="jane@fund.com"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Company / Fund Name</span>
                      </label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={e => setForm({ ...form, company: e.target.value })}
                        placeholder="Acme Ventures"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Investment Range</label>
                      <select
                        value={form.investmentRange}
                        onChange={e => setForm({ ...form, investmentRange: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select a range (optional)</option>
                        {INVESTMENT_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        placeholder="Tell us about your investment focus and what you'd like to know about PetShiwu..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
                    >
                      {loading ? 'Sending...' : (
                        <><Mail className="w-4 h-4" /> Send Inquiry</>
                      )}
                    </button>
                  </form>
                </div>
              )}

              <p className="text-center text-sm text-gray-500 mt-4">
                Or email us directly at{' '}
                <a href="mailto:support@petshiwu.com" className="text-blue-700 hover:underline">support@petshiwu.com</a>
              </p>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default Investors;
