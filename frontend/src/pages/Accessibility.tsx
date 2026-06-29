import SEO from '@/components/SEO';

const Accessibility = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO
        title="Accessibility Statement | Petshiwu"
        description="Petshiwu is committed to making our website accessible to everyone. Learn about our accessibility features and how to get help."
        url="/accessibility"
      />

      <h1 className="text-4xl font-black mb-2 text-gray-900">Accessibility Statement</h1>
      <p className="text-gray-500 mb-8">Last updated: May 20, 2026</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Commitment</h2>
          <p>
            Petshiwu is committed to ensuring digital accessibility for people with disabilities. We
            continually improve the user experience for everyone and apply relevant accessibility standards.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Standards We Follow</h2>
          <p>
            We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These
            guidelines explain how to make web content more accessible to people with disabilities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Accessibility Features</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Keyboard navigation support throughout the site.</li>
            <li>Alt text on all meaningful images.</li>
            <li>Sufficient color contrast for text readability.</li>
            <li>Descriptive link text and form labels.</li>
            <li>Responsive design that works across screen sizes and assistive technologies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Known Limitations</h2>
          <p>
            While we strive for full accessibility, some parts of our site may not yet meet all standards.
            We are actively working to identify and resolve these issues.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Feedback and Contact</h2>
          <p>
            If you experience any accessibility barriers on our site, please let us know. We take all
            feedback seriously and will do our best to resolve issues promptly.
          </p>
          <div className="mt-3 bg-gray-50 rounded-xl p-5 space-y-1">
            <p>Email: <a href="mailto:support@petshiwu.com" className="text-blue-600 hover:underline">support@petshiwu.com</a></p>
            <p>Phone: <a href="tel:+18002592605" className="text-blue-600 hover:underline">+1 (800) 259-2605</a></p>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            We aim to respond to accessibility feedback within 2 business days.
          </p>
        </section>

      </div>
    </div>
  );
};

export default Accessibility;
