import React from 'react';

const features = [
  {
    title: "AI Pet Advisor",
    desc: "24/7 expert guidance tailored to your pet's unique needs.",
    icon: "🤖"
  },
  {
    title: "Breed-Specific Picks",
    desc: "We match products to your pet's breed for optimal health.",
    icon: "🐕"
  },
  {
    title: "Birthday Gifts",
    desc: "Free treats (under $5) for your pet on their special day.",
    icon: "🎂"
  },
  {
    title: "Premium Only",
    desc: "Only verified, vet-approved brands make it to our store.",
    icon: "⭐"
  }
];

const WhyUsSection = () => {
  return (
    <section className="py-16 bg-white px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">What Makes PetShiwu Different</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="text-center p-6 border border-gray-100 rounded-xl hover:shadow-lg transition">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
