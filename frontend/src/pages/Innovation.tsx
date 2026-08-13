import { Link } from 'react-router-dom';
import {
  Bot,
  Camera,
  Mic,
  Stethoscope,
  Zap,
  Shield,
  Package,
  Sparkles,
  ArrowRight,
  ScanLine,
} from 'lucide-react';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import SameDayChecker from '@/components/SameDayChecker';

const TOOLS = [
  {
    icon: ScanLine,
    title: 'Neural Twin Scan',
    desc: 'Photograph your pet. Computer vision builds a live biometric twin — breed constellation, life stage, calorie protocol — and matches a kit from our catalog. This is the demo that makes jaws drop.',
    cta: 'Launch Neural Scan',
    to: '/neural',
  },
  {
    icon: Bot,
    title: 'AI Pet Advisor',
    desc: 'Gemini-powered chat that remembers your pet, recommends products from our catalog, and answers order questions without making you wait on hold.',
    cta: 'Open the advisor',
    onClick: () => window.dispatchEvent(new CustomEvent('openPetAdvisor')),
  },
  {
    icon: Camera,
    title: 'Visual product search',
    desc: 'Photograph a bag of food, a toy, or a barcode-style label. Our visual search matches it against 10,000+ SKUs so you do not have to type the tiny print.',
    cta: 'Try photo search',
    to: '/search',
  },
  {
    icon: Mic,
    title: 'Voice search',
    desc: 'Tap the microphone in the header and say what you need — “grain-free puppy food” or “Royal Canin urinary.” Works in Chrome and Safari.',
    cta: 'Go search',
    to: '/search',
  },
  {
    icon: Stethoscope,
    title: 'Pet symptom checker',
    desc: 'A guided triage flow for common dog and cat issues. It is not a diagnosis — it tells you when home care is reasonable and when to call a vet now.',
    cta: 'Check symptoms',
    to: '/symptom-checker',
  },
  {
    icon: Zap,
    title: 'Live same-day ETA',
    desc: 'Type a ZIP and see immediately whether tonight’s delivery window is still open. Cutoff is 3 PM EST weekdays and 1 PM EST weekends.',
    cta: 'Check your ZIP',
    href: '#zip-checker',
  },
  {
    icon: Package,
    title: 'Real-time stock + tracking',
    desc: 'Cart quantities are validated against live inventory. After checkout, track the order from packed to out-for-delivery without calling support.',
    cta: 'Track an order',
    to: '/track-order',
  },
];

const Innovation = () => {
  return (
    <div className="bg-white">
      <SEO
        title="Smart Shopping Technology | Petshiwu"
        description="See how Petshiwu uses AI, voice search, visual search, and live same-day ZIP checks to get vet-quality pet supplies to NYC doors faster."
        url="/innovation"
      />
      <StructuredData
        type="faq"
        data={{
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Does Petshiwu have an AI pet advisor?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. The AI Pet Advisor is available on every page. It can recommend products, answer order questions, and remember your pet’s name and birthday.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I search Petshiwu with a photo or my voice?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Use visual search on the search page to match a photo to our catalog, or tap the microphone in the header to search by voice in Chrome or Safari.',
              },
            },
            {
              '@type': 'Question',
              name: 'How do I know if same-day delivery is still available?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Enter your ZIP on the homepage or this page. Same-day NYC orders must be placed before 3 PM EST on weekdays or 1 PM EST on weekends for delivery before 11 PM.',
              },
            },
          ],
        }}
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 text-white">
        <div className="absolute -top-24 right-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 lg:px-8 py-16 md:py-24 relative">
          <p className="inline-flex items-center gap-2 text-cyan-200 text-sm font-bold uppercase tracking-widest mb-4">
            <Sparkles size={16} /> Petshiwu Intelligence
          </p>
          <h1 className="text-4xl md:text-6xl font-black max-w-3xl leading-tight">
            Built to impress pet parents — then actually help them
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/80 max-w-2xl">
            Chewy-class catalog. NYC same-day logistics. AI that knows your pet. Try the tools below — they are live on the store, not a pitch deck.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-yellow-300 text-slate-900 font-bold px-6 py-3 rounded-full hover:bg-yellow-200 transition-colors"
            >
              Shop 10,000+ products <ArrowRight size={18} />
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('openPetAdvisor'))}
              className="inline-flex items-center gap-2 bg-white/10 border border-white/30 font-bold px-6 py-3 rounded-full hover:bg-white/20 transition-colors"
            >
              <Bot size={18} /> Ask the AI advisor
            </button>
          </div>
        </div>
      </section>

      <section id="zip-checker" className="container mx-auto px-4 lg:px-8 -mt-8 relative z-10">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 md:p-8 text-white shadow-xl">
          <h2 className="text-2xl font-black mb-2">Live same-day ZIP check</h2>
          <p className="text-white/80 mb-5">See your delivery speed in under a second. No account required.</p>
          <SameDayChecker />
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-16">
        <h2 className="text-3xl font-black text-gray-900 mb-3">What customers can try today</h2>
        <p className="text-gray-600 mb-10 max-w-2xl">
          Every tool is designed to remove a real friction: guessing the food, hunting a SKU, missing the cutoff, or waiting for a human when a quick answer would do.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const body = (
              <>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{tool.title}</h3>
                <p className="text-gray-600 text-sm mt-2 mb-4 leading-relaxed">{tool.desc}</p>
                <span className="text-blue-700 font-bold text-sm">{tool.cta} →</span>
              </>
            );

            if (tool.to) {
              return (
                <Link
                  key={tool.title}
                  to={tool.to}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  {body}
                </Link>
              );
            }
            if (tool.href) {
              return (
                <a
                  key={tool.title}
                  href={tool.href}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  {body}
                </a>
              );
            }
            return (
              <button
                key={tool.title}
                type="button"
                onClick={tool.onClick}
                className="text-left rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {body}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 border-y border-gray-100 py-14">
        <div className="container mx-auto px-4 lg:px-8 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'Secure by default',
              desc: 'Stripe and PayPal checkout, SSL, and PCI-compliant card fields. We never store raw card numbers.',
            },
            {
              icon: Zap,
              title: 'Fast on purpose',
              desc: 'Cached search, compressed APIs, and image CDNs so the store feels instant on a subway connection.',
            },
            {
              icon: Sparkles,
              title: 'Personal, not creepy',
              desc: 'Pet profiles and birthday rewards stay on-device unless you save them. Recommendations follow what you shop, not what you whisper.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title}>
                <Icon className="text-blue-700 mb-3" size={28} />
                <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-black text-gray-900">Ready to see it on a real order?</h2>
        <p className="text-gray-600 mt-3 mb-8">Same vet-quality brands. Same-day in NYC. No autoship required.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-full transition-colors"
        >
          Start shopping <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
};

export default Innovation;
