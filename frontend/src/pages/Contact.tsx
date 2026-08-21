import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import api from '@/services/api';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detect NY timezone abbreviation (EDT during DST, EST otherwise)
  const nyTzAbbr = (() => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    }).formatToParts(new Date());
    return parts.find(p => p.type === 'timeZoneName')?.value || 'ET';
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/v1/contact/general', form, { skipAuth: true });
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
        title="Contact Us | Petshiwu"
        description="Contact Petshiwu for NYC pet delivery orders and questions. Jackson Heights is office and warehouse only — not a walk-in store."
        keywords="contact petshiwu, pet delivery nyc contact, jackson heights pet delivery, pet care support"
      />
      <StructuredData
        type="localBusiness"
        data={{
          businessType: ['OnlineStore', 'LocalBusiness'],
          name: 'Petshiwu',
          url: 'https://www.petshiwu.com',
          logo: 'https://www.petshiwu.com/logo-square-512.png',
          telephone: '+1-800-259-2605',
          email: 'support@petshiwu.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '37-68 74th St',
            addressLocality: 'Jackson Heights',
            addressRegion: 'NY',
            postalCode: '11372',
            addressCountry: 'US'
          },
          openingHoursSpecification: [{
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '00:00',
            closes: '23:59',
          }],
          priceRange: '$$',
          description: 'NYC same-day pet supply delivery. Jackson Heights is office and warehouse only — not a walk-in store. Contact us for orders, questions, or partnership inquiries.',
          areaServed: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
          paymentAccepted: 'Cash, Credit Card, Debit Card',
          currenciesAccepted: 'USD',
          sameAs: [
            'https://www.facebook.com/petshiwu',
            'https://www.instagram.com/petshiwu',
            'https://twitter.com/petshiwu'
          ]
        }}
      />

      <div className="bg-gray-50 min-h-screen">

        {/* Hero */}
        <section className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] text-white py-14 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide mb-4 uppercase">
              We'd love to hear from you
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">Contact Us</h1>
            <p className="text-blue-100 text-base sm:text-lg max-w-xl mx-auto">
              Questions about your order, a product recommendation, or just want to chat about your pet?
              Our call center is here 24/7.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-[1fr,1.4fr] gap-10 lg:gap-14">

            {/* Contact Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Get in Touch</h2>
                <p className="text-gray-600 text-sm">
                  Our call center is available 24/7 to answer your questions and help with orders.
                  Unused items can be returned within 365 days — see our{' '}
                  <a href="/return-policy" className="text-blue-700 hover:underline font-medium">return policy</a>.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                <div className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Office & warehouse — not open to the public</p>
                    <p className="text-gray-600 text-sm">37-68 74th Street</p>
                    <p className="text-gray-600 text-sm">Jackson Heights, NY 11372</p>
                    <p className="text-gray-500 text-xs mt-1">Not a walk-in store. Delivery only — shop online.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Phone — 24/7</p>
                    <a href="tel:+18002592605" className="text-blue-700 hover:text-blue-800 text-sm font-medium">
                      +1 (800) 259-2605
                    </a>
                    <p className="text-xs text-gray-500 mt-1">Call anytime. A real person answers day and night.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Email</p>
                    <a href="mailto:support@petshiwu.com" className="text-blue-700 hover:text-blue-800 text-sm font-medium">
                      support@petshiwu.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">Call center hours</p>
                    <p className="text-sm text-gray-800 font-medium">24/7 — 24 hours a day, 7 days a week</p>
                    <p className="text-xs text-gray-400 mt-1">A real person answers anytime ({nyTzAbbr})</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 text-sm max-w-xs">
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-6 text-blue-700 font-semibold text-sm hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Send Us a Message</h2>
                  <p className="text-sm text-gray-500 mb-6">Prefer to talk? Call 24/7. We also reply to messages around the clock.</p>

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
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          placeholder="jane@example.com"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                      <select
                        required
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select a topic...</option>
                        <option value="order">Order Question</option>
                        <option value="product">Product Recommendation</option>
                        <option value="return">Return / Refund</option>
                        <option value="shipping">Shipping & Delivery</option>
                        <option value="account">Account Help</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        placeholder="Tell us how we can help..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                    >
                      {loading ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {loading ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
