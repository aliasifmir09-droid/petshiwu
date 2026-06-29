import { Stethoscope, Award, BookOpen, Heart } from 'lucide-react';
import SEO from '@/components/SEO';

const VetTeam = () => {
  return (
    <>
      <SEO
        title="Petshiwu Veterinary Advisory Team | NYC Vet-Approved Pet Care"
        description="Meet Petshiwu's veterinary advisory team — credentialed veterinarians and certified pet nutritionists who guide our product selection and content. NYC-based, vet-led pet care."
        keywords="Petshiwu vet team, veterinary advisory, NYC vets, vet-recommended pet supplies, pet nutritionists"
        url="/vet-team"
      />

      <div className="bg-gray-50">
        <section className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] text-white">
          <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
            <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide mb-4 uppercase">
              <Stethoscope className="w-3 h-3 mr-2" /> Veterinary Advisory Team
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Petshiwu's Veterinary Advisory Team
            </h1>
            <p className="text-base sm:text-lg text-blue-100 max-w-2xl mb-6">
              Every product recommendation, every blog article, every customer interaction at Petshiwu is grounded in veterinary science. Our advisory team brings decades of combined clinical and nutritional expertise to your pet's care.
            </p>
            <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl">
              Based in NYC and serving pet parents nationwide, our team ensures Petshiwu carries only vet-trusted brands and provides the most accurate, up-to-date pet care guidance available.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold">Our Commitment</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Petshiwu's veterinary advisory team reviews every brand before it enters our catalog. We reject products with undisclosed ingredients, unverified health claims, or substandard manufacturing practices.
              </p>
              <p className="text-gray-700">
                Our content — including over 1,300 educational articles covering dog breeds, cat health, pet nutrition, and emergency care — is reviewed by credentialed veterinary professionals for medical accuracy.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Stethoscope className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold">Clinical Veterinarians</h3>
                </div>
                <p className="text-gray-700">
                  Our clinical veterinarians bring experience from emergency medicine, internal medicine, surgery, and preventive care. They guide our product curation and review all medical content for accuracy.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold">Certified Pet Nutritionists</h3>
                </div>
                <p className="text-gray-700">
                  Our nutrition team holds advanced certifications in animal nutrition. They evaluate every food formula for AAFCO compliance, ingredient quality, and life-stage appropriateness.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold">Pet Behavior Specialists</h3>
                </div>
                <p className="text-gray-700">
                  Our behavior team guides content on training, socialization, and behavioral health. They help pet parents address common challenges with evidence-based approaches.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold">Standards & Compliance</h3>
                </div>
                <p className="text-gray-700">
                  Every product meets FDA, AAFCO, and state regulatory standards. Our team maintains compliance with veterinary pharmacy regulations for prescription items.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-bold text-blue-900 mb-3">Questions for Our Veterinary Team?</h3>
              <p className="text-blue-800 mb-4">
                Call us at <a href="tel:18002592605" className="font-bold underline">(800) 259-2605</a> for guidance on product selection, nutrition questions, or general pet care advice. Our customer care team is available 9am-8pm ET daily.
              </p>
              <p className="text-blue-800 text-sm">
                For medical emergencies, contact your local veterinarian or nearest emergency animal hospital immediately.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Professional Affiliations</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="font-bold text-gray-900">AVMA</p>
                <p className="text-xs text-gray-600">American Veterinary Medical Association</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="font-bold text-gray-900">AAHA</p>
                <p className="text-xs text-gray-600">American Animal Hospital Association</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="font-bold text-gray-900">AAFCO</p>
                <p className="text-xs text-gray-600">Association of American Feed Control Officials</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="font-bold text-gray-900">WSAVA</p>
                <p className="text-xs text-gray-600">World Small Animal Veterinary Association</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default VetTeam;
