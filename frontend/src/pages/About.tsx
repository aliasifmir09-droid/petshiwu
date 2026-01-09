import { HeartHandshake, Globe2, ShieldCheck, Truck, Users } from 'lucide-react';
import SEO from '@/components/SEO';

const About = () => {
  return (
    <>
      <SEO
        title="About PetShiwu | Your Trusted Partner in Pet Care"
        description="Learn about PetShiwu's 15+ years of pet care experience, our passion for pets, and our commitment to quality, community, and convenient online shopping across the USA."
        keywords="about PetShiwu, pet care, pet store USA, pet community, premium pet products"
      />

      <div className="bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] text-white">
          <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide mb-4 uppercase">
                  About PetShiwu
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                  Your Trusted Partner in Pet Care
                </h1>
                <p className="text-base sm:text-lg text-blue-100 max-w-xl mb-6">
                  With over 15 years of experience in the vibrant Dubai pet market, PetShiwu now brings
                  its passion, expertise, and carefully curated products to pet parents across the USA.
                </p>
                <p className="text-sm sm:text-base text-blue-100/90 max-w-xl">
                  We&apos;re here to support the special bond you share with your furry, feathered, or scaly
                  companions—helping them live happier, healthier, and longer lives.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-blue-900/40 rounded-3xl blur-2xl opacity-70" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <HeartHandshake className="w-10 h-10 text-yellow-300" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-blue-100/80 font-semibold">
                        Our Story
                      </p>
                      <p className="text-lg font-bold">A Passion for Pets, Now Online in the USA</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-blue-50 mb-4">
                    PetShiwu was born from a deep love for animals and a proven commitment to their
                    well-being. After serving pet parents for more than a decade in Dubai, we&apos;ve
                    expanded to the USA to offer premium pet food, toys, and accessories through a
                    seamless online experience.
                  </p>
                  <p className="text-xs sm:text-sm text-blue-100/90">
                    We continuously listen to American pet owners to better understand their unique needs
                    and preferences—so we can bring you products that truly make a difference in your pet&apos;s
                    life.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Commitment Section */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-10 lg:mb-14">
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">
                Our Commitment
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Quality, Care, and Community
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                At PetShiwu, we believe every pet deserves the best. We carefully curate every product,
                partner with trusted brands, and build a community where pet lovers feel supported,
                informed, and inspired.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Carefully Curated Quality
                </h3>
                <p className="text-sm text-gray-600">
                  We partner only with trusted brands that meet our high standards for quality, safety,
                  and ethical sourcing—so you can shop with confidence.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  A Community of Pet Enthusiasts
                </h3>
                <p className="text-sm text-gray-600">
                  We&apos;re more than a store—we&apos;re a community. Our team is passionate about
                  sharing expert advice and supporting pet parents at every stage of their journey.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Convenience & Reliability
                </h3>
                <p className="text-sm text-gray-600">
                  Enjoy easy online shopping, fast shipping across the USA, and a smooth experience from
                  browsing to delivery—so your pet never has to wait long for their favorites.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-12 lg:py-16 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-10 lg:gap-14 items-start">
              <div>
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">
                  Why Choose PetShiwu?
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  Thoughtfully Designed for Modern Pet Parents
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  From nutrition and play to comfort and care, every product in our store is selected
                  with your pet&apos;s health and happiness in mind.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-7 w-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 text-sm font-bold">
                      1
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        Premium Selection
                      </h3>
                      <p className="text-sm text-gray-600">
                        Access a carefully chosen range of high-quality pet food, treats, toys, and
                        accessories you can trust.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-7 w-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 text-sm font-bold">
                      2
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        Expert Guidance
                      </h3>
                      <p className="text-sm text-gray-600">
                        Our experienced team is always ready to offer personalized recommendations and
                        advice based on your pet&apos;s unique needs.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-7 w-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 text-sm font-bold">
                      3
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        Community Focused
                      </h3>
                      <p className="text-sm text-gray-600">
                        We&apos;re dedicated to building lasting relationships with our customers and
                        their pets, fostering a vibrant, supportive pet-loving community across the USA.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-7 w-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 text-sm font-bold">
                      4
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        Convenience & Value
                      </h3>
                      <p className="text-sm text-gray-600">
                        Shop anytime, anywhere—with fast delivery, competitive pricing, and frequent deals
                        on the best pet products.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Globe2 className="w-8 h-8 text-primary-600" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-primary-600 font-semibold">
                      Our Vision
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      Looking Ahead with Your Pets in Mind
                    </p>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-700 mb-4">
                  We are continuously expanding our offerings and enhancing our services to meet the
                  evolving needs of pets and their owners.
                </p>
                <p className="text-sm sm:text-base text-gray-700 mb-4">
                  Our vision is to become one of the most trusted and comprehensive resources for pet
                  supplies online and in local communities—supporting every stage of your pet&apos;s life,
                  from playful beginnings to golden years.
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Thank you for choosing PetShiwu.</span>{' '}
                  We look forward to being your partner in pet care for years to come.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default About;


