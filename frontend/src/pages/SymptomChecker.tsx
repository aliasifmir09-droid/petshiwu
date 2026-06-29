import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import {
  SYMPTOMS,
  TRIAGE_OUTCOMES,
  Symptom,
  TriageLevel,
  TriageOutcome
} from '@/data/symptomChecker';
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Stethoscope,
  Phone,
  Shield,
  CheckCircle2,
  Clock,
  Dog,
  Cat,
  ChevronRight
} from 'lucide-react';

type PetTypeFilter = 'all' | 'dog' | 'cat';

export default function SymptomChecker() {
  const [petFilter, setPetFilter] = useState<PetTypeFilter>('all');
  const [selectedSymptom, setSelectedSymptom] = useState<Symptom | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [triageLevel, setTriageLevel] = useState<TriageLevel | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const filteredSymptoms = useMemo(() => {
    if (petFilter === 'all') return SYMPTOMS;
    return SYMPTOMS.filter(s => s.petType === petFilter);
  }, [petFilter]);

  const currentQuestion = useMemo(() => {
    if (!selectedSymptom || !currentQuestionId) return null;
    if (currentQuestionId.startsWith('triage-')) {
      const level = currentQuestionId.replace('triage-', '') as TriageLevel;
      return { triage: level };
    }
    return {
      question: selectedSymptom.questions.find(q => q.id === currentQuestionId) || null
    };
  }, [selectedSymptom, currentQuestionId]);

  const totalQuestions = selectedSymptom?.questions.length || 0;
  const questionIndex = history.length;

  function handleSelectSymptom(symptom: Symptom) {
    setSelectedSymptom(symptom);
    setCurrentQuestionId(symptom.questions[0].id);
    setHistory([]);
    setTriageLevel(null);
    // Scroll to top of question area
    setTimeout(() => {
      const el = document.getElementById('symptom-flow');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleAnswer(value: string) {
    if (!selectedSymptom || !currentQuestionId) return;

    // Check if current question is a triage trigger
    if (currentQuestionId.startsWith('triage-')) return;

    const question = selectedSymptom.questions.find(q => q.id === currentQuestionId);
    if (!question) return;

    const nextTarget = question.nextMap[value];

    if (nextTarget?.startsWith('triage-')) {
      const level = nextTarget.replace('triage-', '') as TriageLevel;
      setTriageLevel(level);
      setCurrentQuestionId(nextTarget);
    } else {
      setCurrentQuestionId(nextTarget);
    }

    setHistory([...history, currentQuestionId]);

    setTimeout(() => {
      const el = document.getElementById('symptom-flow');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleBack() {
    if (history.length === 0) return;
    const newHistory = [...history];
    const prevQuestionId = newHistory.pop();
    setHistory(newHistory);
    setTriageLevel(null);
    setCurrentQuestionId(prevQuestionId || null);
  }

  function handleReset() {
    setSelectedSymptom(null);
    setCurrentQuestionId(null);
    setTriageLevel(null);
    setHistory([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const outcome: TriageOutcome | null = triageLevel ? TRIAGE_OUTCOMES[triageLevel] : null;

  const triageColors = {
    home: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-700',
      badge: 'bg-green-500',
      button: 'bg-green-600 hover:bg-green-700'
    },
    'vet-today': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-700',
      badge: 'bg-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    emergency: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-700',
      badge: 'bg-red-500',
      button: 'bg-red-600 hover:bg-red-700'
    }
  };

  // MedicalWebPage schema
  const medicalSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'Petshiwu Pet Symptom Checker',
    description: 'Interactive pet symptom triage tool. Quick questions help you decide whether to monitor at home, call your vet, or go to the emergency vet.',
    url: 'https://www.petshiwu.com/symptom-checker',
    publisher: {
      '@type': 'Organization',
      name: 'Petshiwu',
      url: 'https://www.petshiwu.com'
    },
    reviewedBy: {
      '@type': 'Organization',
      name: 'Petshiwu Veterinary Advisory Team'
    },
    medicalAudience: {
      '@type': 'PeopleAudience',
      audienceType: 'Pet parents'
    },
    about: [
      { '@type': 'MedicalCondition', name: 'Pet symptom triage' }
    ]
  };

  return (
    <>
      <SEO
        title="Pet Symptom Checker | Is It an Emergency? NYC Vet Triage Tool"
        description="Free interactive pet symptom checker. Answer a few questions and we'll help you decide: monitor at home, call your vet, or go to the emergency vet. For dogs and cats."
        keywords="pet symptom checker, dog vomiting, cat not eating, dog diarrhea, when to call vet, pet emergency, NYC vet triage, is my pet sick"
        url="/symptom-checker"
        type="article"
      />
      <StructuredData type="article" data={medicalSchema as any} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* HERO */}
        <section className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] text-white py-12 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide mb-4 uppercase">
                <Stethoscope className="w-3 h-3 mr-2" /> Free Vet-Supervised Tool
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                Pet Symptom Checker
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-6">
                Worried about your pet? Answer a few quick questions and we'll help you decide:
                <strong className="block mt-2 text-white">monitor at home, call your vet, or go to the emergency vet.</strong>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-blue-100">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Takes ~60 seconds
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Vet-supervised logic
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> No signup required
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DISCLAIMER */}
        <section className="container mx-auto px-4 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <strong className="font-semibold">This tool is informational only and not a substitute for veterinary care.</strong>{' '}
              When in doubt, contact your vet or the nearest emergency veterinary hospital. If your pet is in immediate distress, skip this and go to the ER now.
            </div>
          </div>
        </section>

        {/* SYMPTOM PICKER (shown when no symptom selected) */}
        {!selectedSymptom && (
          <section className="container mx-auto px-4 lg:px-8 pb-16">
            <div className="max-w-5xl mx-auto">
              {/* Filter tabs */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <button
                  onClick={() => setPetFilter('all')}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    petFilter === 'all'
                      ? 'bg-[#1E3A8A] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  All Pets
                </button>
                <button
                  onClick={() => setPetFilter('dog')}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                    petFilter === 'dog'
                      ? 'bg-[#1E3A8A] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Dog className="w-4 h-4" /> Dogs
                </button>
                <button
                  onClick={() => setPetFilter('cat')}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                    petFilter === 'cat'
                      ? 'bg-[#1E3A8A] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Cat className="w-4 h-4" /> Cats
                </button>
              </div>

              {/* Symptom grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSymptoms.map(symptom => (
                  <button
                    key={symptom.id}
                    onClick={() => handleSelectSymptom(symptom)}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-[#2563EB] hover:shadow-lg p-6 text-left transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{symptom.emoji}</div>
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase">
                        {symptom.petType === 'dog' ? <Dog className="w-3 h-3" /> : <Cat className="w-3 h-3" />}
                        {symptom.petType}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#1E3A8A] transition-colors">
                      {symptom.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {symptom.description}
                    </p>
                    <div className="flex items-center text-sm font-semibold text-[#2563EB] group-hover:translate-x-1 transition-transform">
                      Start check <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </button>
                ))}
              </div>

              {/* CTA footer */}
              <div className="mt-12 text-center">
                <p className="text-gray-600 mb-4">Don't see your pet's symptom?</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/vet-team"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-gray-300"
                  >
                    <Stethoscope className="w-4 h-4" /> Meet our vet team
                  </Link>
                  <Link
                    to="/learning"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-gray-300"
                  >
                    Browse 2,700+ pet health articles →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SYMPTOM FLOW (shown when symptom selected) */}
        {selectedSymptom && (
          <section id="symptom-flow" className="container mx-auto px-4 lg:px-8 pb-16">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{selectedSymptom.emoji}</div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                        {selectedSymptom.petType === 'dog' ? <Dog className="w-3 h-3" /> : <Cat className="w-3 h-3" />}
                        {selectedSymptom.petType} symptom
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedSymptom.title}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Start over
                  </button>
                </div>

                {/* Red flags */}
                {selectedSymptom.redFlags.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm font-semibold text-red-700 cursor-pointer flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Go to ER immediately if you see any of these
                    </summary>
                    <ul className="mt-2 space-y-1.5 text-sm text-red-900 ml-6">
                      {selectedSymptom.redFlags.map((flag, i) => (
                        <li key={i} className="list-disc">{flag}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              {/* Progress bar */}
              {!outcome && currentQuestion?.question && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span className="font-medium">
                      Question {questionIndex + 1} of {totalQuestions}
                    </span>
                    <span>
                      {Math.round((questionIndex / totalQuestions) * 100)}% complete
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] transition-all duration-300"
                      style={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Question */}
              {!outcome && currentQuestion?.question && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8 mb-6 animate-fadeIn">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                    {currentQuestion.question.question}
                  </h3>
                  {currentQuestion.question.helper && (
                    <p className="text-sm text-gray-600 mb-6">
                      {currentQuestion.question.helper}
                    </p>
                  )}

                  <div className="space-y-3">
                    {currentQuestion.question.options.map(option => {
                      const severityStyles = {
                        normal: 'border-gray-200 hover:border-green-500 hover:bg-green-50',
                        concern: 'border-gray-200 hover:border-yellow-500 hover:bg-yellow-50',
                        critical: 'border-gray-200 hover:border-red-500 hover:bg-red-50'
                      };
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleAnswer(option.value)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${severityStyles[option.severity]}`}
                        >
                          <span className="font-medium text-gray-900">{option.label}</span>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                      );
                    })}
                  </div>

                  {history.length > 0 && (
                    <button
                      onClick={handleBack}
                      className="mt-6 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous question
                    </button>
                  )}
                </div>
              )}

              {/* TRIAGE OUTCOME */}
              {outcome && (
                <div className={`rounded-2xl shadow-lg border-2 ${triageColors[outcome.level].border} ${triageColors[outcome.level].bg} overflow-hidden animate-fadeIn`}>
                  {/* Header */}
                  <div className={`${triageColors[outcome.level].badge} text-white px-6 py-5`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        {outcome.level === 'emergency' ? <AlertTriangle className="w-7 h-7" /> :
                         outcome.level === 'vet-today' ? <Clock className="w-7 h-7" /> :
                         <CheckCircle2 className="w-7 h-7" />}
                      </div>
                      <div>
                        <div className="text-xs uppercase font-semibold tracking-wider opacity-90">
                          Triage Result
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-extrabold">
                          {outcome.headline}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 lg:p-8">
                    <p className="text-lg text-gray-900 mb-6 leading-relaxed">
                      {outcome.recommendation}
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3 mb-8">
                      {outcome.level === 'emergency' && (
                        <Link
                          to="/learning/emergency-vet-nyc"
                          className={`${triageColors[outcome.level].button} text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-colors`}
                        >
                          <Phone className="w-4 h-4" /> Find an emergency vet in NYC
                        </Link>
                      )}
                      {outcome.level === 'vet-today' && (
                        <Link
                          to="/learning/vet-near-me-nyc"
                          className={`${triageColors[outcome.level].button} text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-colors`}
                        >
                          <Stethoscope className="w-4 h-4" /> Find a vet near you
                        </Link>
                      )}
                      <button
                        onClick={handleReset}
                        className="bg-white border-2 border-gray-300 px-6 py-3 rounded-full font-semibold text-gray-700 hover:border-gray-400 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Check another symptom
                      </button>
                    </div>

                    {/* Next Steps */}
                    <div className="mb-6">
                      <h3 className={`text-lg font-bold ${triageColors[outcome.level].text} mb-3 flex items-center gap-2`}>
                        <ChevronRight className="w-5 h-5" />
                        What to do next
                      </h3>
                      <ol className="space-y-2.5">
                        {outcome.nextSteps.map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <span className={`flex-shrink-0 w-7 h-7 rounded-full ${triageColors[outcome.level].badge} text-white text-sm font-bold flex items-center justify-center`}>
                              {i + 1}
                            </span>
                            <span className="text-gray-900 pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Watch for */}
                    {outcome.watchFor.length > 0 && (
                      <div className="bg-white rounded-xl p-5 mb-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          Watch for these signs of worsening
                        </h3>
                        <ul className="space-y-1.5 text-sm text-gray-700">
                          {outcome.watchFor.map((sign, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{sign}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Related Products */}
                    {outcome.relatedProducts && outcome.relatedProducts.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">
                          Recommended products
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {outcome.relatedProducts.map((product, i) => (
                            <Link
                              key={i}
                              to={product.slug}
                              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#2563EB] hover:shadow-sm transition-all"
                            >
                              <div className="font-semibold text-gray-900 mb-1">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {product.reason}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Blogs */}
                    {outcome.relatedBlogs && outcome.relatedBlogs.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">
                          Learn more
                        </h3>
                        <div className="space-y-2">
                          {outcome.relatedBlogs.map((blog, i) => (
                            <Link
                              key={i}
                              to={blog.slug}
                              className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-[#2563EB] hover:shadow-sm transition-all"
                            >
                              <div className="font-semibold text-gray-900 mb-1 flex items-center justify-between">
                                {blog.title}
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                              </div>
                              <div className="text-xs text-gray-600">
                                {blog.reason}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom CTA */}
              <div className="mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 text-center border border-blue-100">
                <p className="text-gray-700 mb-3">
                  This tool was built by pet parents, for pet parents, with guidance from our vet team.
                </p>
                <Link
                  to="/vet-team"
                  className="inline-flex items-center gap-2 text-[#1E3A8A] font-semibold hover:underline"
                >
                  Meet the Petshiwu Veterinary Advisory Team <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
