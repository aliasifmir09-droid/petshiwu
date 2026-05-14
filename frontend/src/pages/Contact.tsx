import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import SEO from '@/components/SEO';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission (no backend email yet)
    await new Promise(res => setTimeout(res, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <>
      <SEO
        title="Contact Us | Petshiwu"
        description="Get in touch with Petshiwu. We're here to help with your pet care questions, orders, and anything else you need. Located in Jackson Heights, NY."
        keywords="contact petshiwu, pet store contact, jackson heights pet store, pet care support"
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
              We're here Monday through Sunday.
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
                  Our team is available 7 days a week to answer your questions and help with orders.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                <div className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Our Store</p>
                    <p className="text-gray-600 text-sm">37-68 74th Street</p>
                    <p className="text-gray-600 text-sm">Jackson Heights, NY 11372</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Phone</p>
                    <a href="tel:+16263420419" className="text-blue-700 hover:text-blue-800 text-sm font-medium">
                      +1 (626) 342-0419
                    </a>
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
                    <p className="font-semibold text-gray-900 text-sm mb-1">Hours</p>
                    <div className="space-y-0.5 text-sm text-gray-600">
                      <div className="flex justify-between gap-6">
                        <span>Monday - Friday</span>
                        <span className="font-medium text-gray-800">9:00 AM - 8:00 PM</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span>Saturday - Sunday</span>
                        <span className="font-medium text-gray-800">9:00 AM - 6:00 PM</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">All times Eastern (EST)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map embed */}
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-56">
                <iframe
                  title="Petshiwu Location"
                  src="https://maps.google.com/maps?q=37-68+74th+Street,+Jackson+Heights,+NY+11372&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
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
                  <p className="text-sm text-gray-500 mb-6">We typically respond within a few hours during business hours.</p>

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
