import React from 'react';

const BirthdayBanner = () => {
  return (
    <div className="birthday-banner-container my-10 px-4">
      <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
        {/* Decorative Background Icon */}
        <div className="absolute -right-4 -bottom-4 text-9xl opacity-10 transform -rotate-12 select-none">
          🎂
        </div>

        <div className="flex-1 z-10">
          <span className="bg-blue-400 bg-opacity-30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
            PetShiwu Loyalty
          </span>
          <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
            Every Pet Deserves a Birthday Treat! 🎂
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl">
            Tell our AI Advisor your pet's name and birthday, and we'll send a <strong>FREE GIFT</strong> (under $5) on their special day.
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openAIAdvisor'))}
            className="bg-white text-blue-700 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-lg transform hover:-translate-y-1"
          >
            Register Your Pet Now
          </button>
        </div>

        <div className="w-full md:w-72 h-48 md:h-64 bg-cover bg-center rounded-xl shadow-2xl z-10" 
             style={{backgroundImage: "url('https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=800')"}}>
        </div>
      </div>
    </div>
  );
};

