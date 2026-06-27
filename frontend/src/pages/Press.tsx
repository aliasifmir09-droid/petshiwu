import { Mail, ExternalLink, Building2 } from 'lucide-react';
import SEO from '@/components/SEO';

const Press = () => {
  return (
    <>
      <SEO
        title="Petshiwu Press & Newsroom | NYC Pet Supplier Coverage"
        description="Press releases, news coverage, and media resources for Petshiwu — Jackson Heights, Queens-based pet supply delivery service competing with Chewy via no-autoship FREEDOM20 model."
        keywords="Petshiwu press, Petshiwu newsroom, NYC pet supplier press release, FREEDOM20, Jackson Heights pet store news"
        url="/press"
      />

      <div className="bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] text-white">
          <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
            <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide mb-4 uppercase">
              Press &amp; Newsroom
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Petshiwu Press &amp; Newsroom
            </h1>
            <p className="text-base sm:text-lg text-blue-100 max-w-3xl">
              Petshiwu is NYC&apos;s only all-5-borough same-day pet supply service, based in Jackson Heights, Queens.
              Founded in 2025, Petshiwu competes with Chewy via a no-autoship-lock-in business model.
              Press inquiries: <a href="mailto:press@petshiwu.com" className="underline">press@petshiwu.com</a>
            </p>
          </div>
        </section>

        {/* Press Contact */}
        <section className="container mx-auto px-4 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <Mail className="w-8 h-8 text-[#1E3A8A] flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold mb-2">Press Contact</h2>
                <p className="text-gray-700 mb-1"><strong>Pet Chiwu, Founder</strong></p>
                <p className="text-gray-700">
                  Email: <a href="mailto:press@petshiwu.com" className="text-[#1E3A8A] underline">press@petshiwu.com</a>
                </p>
                <p className="text-gray-700">
                  Phone: <a href="tel:+18002592605" className="text-[#1E3A8A] underline">+1 (800) 259-2605</a>
                </p>
                <p className="text-gray-700">
                  Headquarters: 37-68 74th Street, Jackson Heights, NY 11372
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Company Facts */}
        <section className="container mx-auto px-4 lg:px-8 pb-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-4">
              <Building2 className="w-8 h-8 text-[#1E3A8A] flex-shrink-0 mt-1" />
              <h2 className="text-xl font-bold">Company Facts</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-gray-700">
              <div><strong>Founded:</strong> 2025</div>
              <div><strong>Headquarters:</strong> Jackson Heights, Queens, NY</div>
              <div><strong>Founder:</strong> Pet Chiwu</div>
              <div><strong>Service Area:</strong> NYC all 5 boroughs + nationwide shipping</div>
              <div><strong>Products:</strong> 10,000+ SKUs, premium brands including Hill&apos;s, Royal Canin, Purina</div>
              <div><strong>Delivery:</strong> Same-day NYC, nationwide shipping</div>
              <div><strong>Discount Code:</strong> FREEDOM20 (20% off, no autoship required)</div>
              <div><strong>Phone:</strong> +1 (800) 259-2605</div>
            </div>
          </div>
        </section>

        {/* Press Releases */}
        <section className="container mx-auto px-4 lg:px-8 pb-16">
          <h2 className="text-2xl font-bold mb-6">Press Releases</h2>

          {/* FREEDOM20 Launch */}
          <article className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold">Featured</span>
              <span>July 1, 2026</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              NYC Pet Supplier Petshiwu Takes Anti-Chewy Stance with FREEDOM20
            </h3>
            <p className="text-sm text-gray-600 italic mb-4">
              While Chewy forces customers into recurring subscriptions for the best prices, Petshiwu offers the same 20% discount on every order.
            </p>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
              <p><strong>NEW YORK, NY — July 1, 2026 —</strong> Petshiwu, NYC&apos;s only all-5-borough same-day pet supply service, today launched FREEDOM20 — a 20% discount (capped at $10) that works on every order, with no Autoship subscription required.</p>

              <p>The launch comes as a direct counter-position to Chewy, the $11B+ national pet retailer that ties its best pricing to recurring Autoship subscriptions. Petshiwu&apos;s approach: the same 20% off works whether it&apos;s your first order, your tenth order, or one-time vs subscription.</p>

              <p>&ldquo;Petshiwu exists because NYC pet parents shouldn&apos;t have to choose between vet-quality products and same-day convenience,&rdquo; said Pet, founder. &ldquo;And they shouldn&apos;t have to choose between discounts and freedom. Chewy forces Autoship for the best prices. We give you the same price every time — your choice, your schedule.&rdquo;</p>

              <h4 className="text-base font-bold mt-6">FREEDOM20 details:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>20% off every order, capped at $10 maximum</li>
                <li>Works on first order AND every repeat order</li>
                <li>No Autoship subscription required</li>
                <li>Optional Autoship available for customer convenience (same price)</li>
                <li>Same-day NYC delivery (order by 3 PM EST, delivered by 11 PM)</li>
                <li>Applies to 10,000+ vet-curated products</li>
              </ul>

              <h4 className="text-base font-bold mt-6">About Petshiwu</h4>
              <p>Petshiwu is a Jackson Heights, Queens-based pet supply delivery service founded in 2025 by Pet Chiwu, a NYC native. The company delivers premium pet food, supplies, and prescription veterinary diets same-day across all five NYC boroughs from a warehouse at 37-68 74th Street. Petshiwu carries 10,000+ products from brands including Hill&apos;s, Royal Canin, Purina, Orijen, Acana, and Stella &amp; Chewy&apos;s.</p>

              <h4 className="text-base font-bold mt-6">Media inquiries</h4>
              <p>Press contact: <a href="mailto:press@petshiwu.com" className="text-[#1E3A8A] underline">press@petshiwu.com</a> | <a href="tel:+18002592605" className="text-[#1E3A8A] underline">+1 (800) 259-2605</a></p>
            </div>
          </article>

          {/* Coverage Targets */}
          <article className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>June 27, 2026</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Coverage Targets &amp; Outreach</h3>
            <p className="text-gray-700 mb-3">
              Petshiwu has prepared press outreach for the following outlets. Coverage updates will be added here as stories publish.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="border-l-4 border-blue-200 pl-3">
                <strong>NYC Business:</strong> Crain&apos;s New York, NY Post, Bloomberg, amNY
              </div>
              <div className="border-l-4 border-blue-200 pl-3">
                <strong>Retail/E-commerce:</strong> Modern Retail, Retail Brew, Glossy, Future Commerce
              </div>
              <div className="border-l-4 border-blue-200 pl-3">
                <strong>Pet Trade:</strong> Pet Age, Pet Business, Petfood Industry
              </div>
              <div className="border-l-4 border-blue-200 pl-3">
                <strong>NYC Local:</strong> QNS.com, Queens Chronicle, Brooklyn Paper, Gothamist, TimeOut NY
              </div>
              <div className="border-l-4 border-blue-200 pl-3">
                <strong>Podcast:</strong> No Bad Dogs, Down and Back (AKC), School For The Dogs
              </div>
              <div className="border-l-4 border-blue-200 pl-3">
                <strong>Newsletter:</strong> Pets and the City (Dr. Amy Attas), Dogs &amp; the City (Isabel Klee)
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 italic">
              Coverage will appear here as stories publish. Last updated: June 27, 2026.
            </p>
          </article>

          {/* Milestone */}
          <article className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>June 26, 2026</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Petshiwu Reaches 1,652 Pet Care Articles</h3>
            <p className="text-gray-700">
              Petshiwu&apos;s Pet Care Library now contains 1,652 articles covering dog and cat health conditions, breed guides, NYC neighborhood guides, prescription diet reviews, and emergency care. The library includes brand-condition prescription guides for Hill&apos;s k/d, Royal Canin Renal, and Purina NF kidney diets, plus 9 YMYL depth articles covering cancer, seizure, bloat, heatstroke, and poisoning emergencies.
            </p>
          </article>

          {/* Brand Assets */}
          <article className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-3">Brand Assets</h3>
            <p className="text-gray-700 mb-4">For media use:</p>
            <ul className="space-y-2 text-gray-700">
              <li>Logo (PNG): <a href="/logo.png" className="text-[#1E3A8A] underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> /logo.png</a></li>
              <li>Logo square (192×192): <a href="/logo-square-192.png" className="text-[#1E3A8A] underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> /logo-square-192.png</a></li>
              <li>Banner: <a href="/banner-one-stop.jpg" className="text-[#1E3A8A] underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> /banner-one-stop.jpg</a></li>
              <li>Brand colors: Navy #1E3A8A, Gold #f59e0b, Blue #2563EB</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  );
};

export default Press;
