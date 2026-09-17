import SEO from '@/components/SEO';

const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO
        title="Terms of Service | Petshiwu"
        description="Read Petshiwu's Terms of Service covering purchases, returns, payments, and your rights as a customer."
        url="/terms"
      />

      <h1 className="text-4xl font-black mb-2 text-gray-900">Terms of Service</h1>
      <p className="text-gray-500 mb-8">Last updated: September 16, 2026</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Agreement to Terms</h2>
          <p>
            By accessing or using <strong>petshiwu.com</strong> ("Site"), you agree to be bound by these Terms
            of Service ("Terms"). If you do not agree, please do not use the Site. These Terms apply to all
            visitors, customers, and anyone who accesses or uses our services.
          </p>
          <p className="mt-2">
            Petshiwu is the seller of record for purchases on this site. We pack orders from
            37-68 74th St, Jackson Heights, NY 11372 (office and warehouse only — not a walk-in store). Contact us
            at{' '}
            <a href="mailto:support@petshiwu.com" className="text-blue-600 hover:underline">
              support@petshiwu.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Products and Pricing</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All prices are listed in US Dollars (USD).</li>
            <li>We reserve the right to change prices at any time without notice.</li>
            <li>We make every effort to display accurate product information, but we do not warrant that
              descriptions, images, or prices are error-free.</li>
            <li>We reserve the right to refuse or cancel any order placed for a product at an incorrect price.</li>
            <li>Product availability is not guaranteed and may change without notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Orders and Payment</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>By placing an order, you represent that you are 18 years of age or older.</li>
            <li>We reserve the right to refuse any order at our discretion.</li>
            <li>Payment is processed securely through our payment partners (Stripe, PayPal). By providing
              payment information, you authorize us to charge the total amount of your order.</li>
            <li>You are responsible for providing accurate shipping and billing information.</li>
            <li>You can cancel an unshipped order within 2 hours by emailing support@petshiwu.com. After it ships, use the 365-day return policy.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Shipping</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We offer free standard shipping on orders over $49.</li>
            <li>Estimated delivery times are provided at checkout and are a target, not a guarantee. If we miss a same-day window after a before-cutoff NYC order, we reship the next day free or refund the order.</li>
            <li>Risk of loss and title for products pass to you upon delivery to the carrier.</li>
            <li>We are not responsible for delays caused by the carrier or circumstances beyond our control.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Returns and Refunds</h2>
          <p>
            We want you to be fully satisfied with every purchase. If you are not satisfied, you may return
            most items within 365 days of delivery for a refund or exchange, subject to the following:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Items must be unused, in original packaging, and in the same condition as received.</li>
            <li>Unopened food, treats, and supplements in original packaging can be returned within 365 days. Opened food, treats, or supplements can only be returned if they arrived damaged, defective, or incorrect.</li>
            <li>Refunds are issued to the original payment method within 5-10 business days of receiving
              the return.</li>
            <li>Return shipping costs are the customer's responsibility unless the item was defective or
              incorrectly shipped.</li>
          </ul>
          <p className="mt-2">
            To initiate a return, visit our{' '}
            <a href="/return-policy" className="text-blue-600 hover:underline">Return Policy page</a> or
            contact us at{' '}
            <a href="mailto:support@petshiwu.com" className="text-blue-600 hover:underline">support@petshiwu.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">6. User Accounts</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining the confidentiality of your account password.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
            <li>We reserve the right to terminate accounts that violate these Terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Prohibited Uses</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Use the Site for any unlawful purpose or in violation of these Terms.</li>
            <li>Attempt to gain unauthorized access to any portion of the Site or our systems.</li>
            <li>Scrape, harvest, or collect data from the Site without our written permission.</li>
            <li>Submit false or misleading information.</li>
            <li>Use the Site in any way that could harm, disable, or impair it.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Intellectual Property</h2>
          <p>
            All content on the Site — including text, images, logos, product descriptions, and design —
            is the property of Petshiwu or our content suppliers and is protected by copyright and other
            intellectual property laws. You may not reproduce, distribute, or create derivative works without
            our written permission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Disclaimer of Warranties</h2>
          <p>
            THE SITE AND ALL PRODUCTS ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
            OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, PETSHIWU DISCLAIMS ALL WARRANTIES, INCLUDING
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, PETSHIWU SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SITE
            OR PURCHASE OF PRODUCTS. OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNT YOU PAID
            FOR THE SPECIFIC PRODUCT OR SERVICE GIVING RISE TO THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of
            New York, without regard to its conflict of law provisions. Any disputes shall be resolved
            in the courts of New York County, New York.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be posted on this page
            with an updated date. Your continued use of the Site after changes are posted constitutes
            acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">13. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <div className="mt-3 bg-gray-50 rounded-xl p-5 space-y-1">
            <p><strong>Petshiwu</strong> (seller of record)</p>
            <p>37-68 74th St, Jackson Heights, NY 11372</p>
            <p>Email: <a href="mailto:support@petshiwu.com" className="text-blue-600 hover:underline">support@petshiwu.com</a></p>
            <p>Phone: <a href="tel:+18002592605" className="text-blue-600 hover:underline">+1 (800) 259-2605</a> (call center 24/7)</p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Terms;
