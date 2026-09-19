import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { generateBreadcrumbSchema } from '@/utils/seoUtils';

const EditorialStandards = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="How We Write Pet Care Guides | Petshiwü Editorial Standards"
        description="Petshiwü Care Desk standards: people-first education, veterinarian-first health advice, no fake urgency, and we do not delete indexed guide URLs."
        url="/editorial-standards"
      />
      <StructuredData
        type="breadcrumb"
        data={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Learning', url: '/learning' },
          { name: 'Editorial standards', url: '/editorial-standards' },
        ])}
      />
      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Petshiwü Care Desk
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">How we write pet care guides</h1>
        <p className="text-lg text-gray-700 mb-8">
          These pages are for pet parents who need a clear next step — not a trick to rank a
          thousand copies of the same paragraph. We keep published education URLs live once Google
          has indexed them.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-3">People first</h2>
        <p className="text-gray-700 mb-4">
          A guide has to answer a real question: what to feed, what is toxic, how to switch food,
          when to call a vet. We do not write doorway pages that only exist to capture a
          neighborhood name.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-3">Health is educational, not a diagnosis</h2>
        <p className="text-gray-700 mb-4">
          Nutrition and first-aid explainers are not a substitute for an exam. If a pet is in
          distress, we say to call a veterinarian or emergency clinic. We do not invent symptoms or
          promise a food will treat a disease.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-3">Who writes this</h2>
        <p className="text-gray-700 mb-4">
          The byline is Petshiwü Care Desk. We review shopping and routine-care pieces against
          manufacturer labels and widely published veterinary guidance. We are an online store —
          currently delivering in NYC, with nationwide shipping opening — not a clinic.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-3">What we will not do</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-8">
          <li>Delete or noindex education URLs that already took time to get indexed</li>
          <li>Fake countdown clocks or “only 3 left” flash sales</li>
          <li>Claim same-day delivery nationwide</li>
          <li>Autoship or surprise subscriptions</li>
        </ul>

        <p className="text-gray-700">
          Start with the{' '}
          <Link
            to="/learning/next-day-pet-delivery-within-50-miles-of-queens"
            className="text-[#1E3A8A] font-semibold hover:underline"
          >
            next-day delivery guide
          </Link>
          , the{' '}
          <Link to="/learning/fall-2026-pet-care-playbook" className="text-[#1E3A8A] font-semibold hover:underline">
            Fall 2026 pet care playbook
          </Link>{' '}
          or the full{' '}
          <Link to="/learning" className="text-[#1E3A8A] font-semibold hover:underline">
            Learning Center
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default EditorialStandards;
