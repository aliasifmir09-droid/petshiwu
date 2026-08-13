import { Link } from 'react-router-dom';
import { Bot, Camera, Stethoscope, Zap, Sparkles, ScanLine } from 'lucide-react';
import SameDayChecker from './SameDayChecker';

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Neural Twin Scan',
    desc: 'Photograph your pet. We generate a biometric twin and a live product kit.',
    to: '/neural',
    action: 'Launch Neural',
  },
  {
    icon: Bot,
    title: 'AI Pet Advisor',
    desc: 'Ask about food, allergies, or orders — get an answer in seconds.',
    action: 'Ask Pawsy',
    onClick: () => window.dispatchEvent(new CustomEvent('openPetAdvisor')),
  },
  {
    icon: Camera,
    title: 'Visual Search',
    desc: 'Snap a bag, toy, or label. We match it to our catalog.',
    to: '/search',
    action: 'Search with a photo',
  },
  {
    icon: Stethoscope,
    title: 'Symptom Checker',
    desc: 'Guided triage for common pet issues — plus when to call a vet.',
    to: '/symptom-checker',
    action: 'Check symptoms',
  },
];

const SmartTechShowcase = () => {
  return (
    <section className="container mx-auto px-4 lg:px-8 mt-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white shadow-xl">
        <div className="absolute -top-24 -right-16 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-10 p-6 sm:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200 mb-4">
              <Sparkles size={14} />
              Smart shopping
            </div>
            <h2 className="text-3xl md:text-4xl font-black leading-tight">
              Technology that gets treats to the door faster
            </h2>
            <p className="mt-3 text-white/80 text-base md:text-lg max-w-xl">
              Instant same-day ZIP check, AI product advice, photo search, and voice search — built for NYC pet parents who do not have time to guess.
            </p>

            <div className="mt-6">
              <p className="text-sm font-semibold text-cyan-100 mb-2 flex items-center gap-2">
                <Zap size={16} className="text-yellow-300" />
                Check same-day delivery
              </p>
              <SameDayChecker />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 content-start">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              const inner = (
                <>
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-lg">{feature.title}</h3>
                  <p className="text-sm text-white/75 mt-1 mb-3">{feature.desc}</p>
                  <span className="text-sm font-bold text-yellow-300">{feature.action} →</span>
                </>
              );

              if (feature.to) {
                return (
                  <Link
                    key={feature.title}
                    to={feature.to}
                    className="rounded-2xl bg-white/10 border border-white/15 p-4 hover:bg-white/20 transition-colors"
                  >
                    {inner}
                  </Link>
                );
              }

              return (
                <button
                  key={feature.title}
                  type="button"
                  onClick={feature.onClick}
                  className="text-left rounded-2xl bg-white/10 border border-white/15 p-4 hover:bg-white/20 transition-colors"
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative px-6 sm:px-10 pb-6">
          <Link
            to="/innovation"
            className="inline-flex items-center gap-1 text-sm font-semibold text-white/80 hover:text-white"
          >
            See how Petshiwu uses technology →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SmartTechShowcase;
