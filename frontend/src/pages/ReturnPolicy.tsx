import { RotateCcw, CheckCircle2, XCircle, Truck, Mail, Clock, AlertCircle, FileText } from 'lucide-react';
import SEO from '@/components/SEO';

const ReturnPolicy = () => {
  return (
    <>
      <SEO
        title="Return & Exchange Policy | PetShiwu"
        description="PetShiwu's 30-day return and exchange policy. Learn about eligible returns, non-returnable items, refunds, and how to process returns or exchanges for your pet products."
        keywords="return policy, exchange policy, refund policy, pet product returns, 30-day guarantee"
      />

      <div className="bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] text-white">
          <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 border border-white/20 mb-4">
                <RotateCcw className="w-8 h-8" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                Return & Exchange Policy
              </h1>
              <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto">
                At PetShiwu, your pet&apos;s happiness and your satisfaction come first. We proudly stand behind the quality of our products and strive to make every purchase worry-free.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              
              {/* 30-Day Guarantee */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      🐾 30-Day Satisfaction Guarantee
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      We offer a <strong>30-day return or exchange policy</strong> from the date you receive your order.
                    </p>
                    <p className="text-gray-700 leading-relaxed mt-2">
                      If you are not completely satisfied, you may return or exchange eligible items within 30 days, <strong>no questions asked</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Eligible Returns */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">✅ Eligible Returns & Exchanges</h2>
                    <p className="text-gray-700 mb-4">You may return or exchange items if:</p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">The item is <strong>unused, unopened, and in original packaging</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">The item <strong>arrived damaged or defective</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">You <strong>received the wrong item</strong></span>
                      </li>
                    </ul>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        📌 <strong>Note:</strong> For hygiene and safety reasons, certain items may not be eligible (see exclusions below).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Non-Returnable Items */}
              <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 lg:p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">🚫 Non-Returnable Items</h2>
                    <p className="text-gray-700 mb-4">
                      The following items <strong>cannot be returned or exchanged</strong>, unless they arrive damaged or defective:
                    </p>
                    <ul className="space-y-3 mb-4">
                      <li className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700"><strong>Opened food, treats, or supplements</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700"><strong>Used grooming products</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700"><strong>Clearance or final-sale items</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700"><strong>Personalized or custom items</strong></span>
                      </li>
                    </ul>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        These exclusions follow standard U.S. pet industry safety and hygiene regulations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exchanges */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <RotateCcw className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">🔄 Exchanges</h2>
                    <p className="text-gray-700 mb-4">If you need a different size, color, or replacement:</p>
                    <ol className="space-y-3 list-decimal list-inside text-gray-700">
                      <li>Contact us within <strong>30 days of delivery</strong></li>
                      <li>We&apos;ll ship the replacement once the original item is received (or immediately for damaged items)</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Return Process */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">📦 Return Process</h2>
                    <ol className="space-y-4 mb-4">
                      <li className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">1</span>
                        <div>
                          <p className="text-gray-700 font-semibold mb-1">Email us at <a href="mailto:support@petshiwu.com" className="text-primary-600 hover:underline">support@petshiwu.com</a> with:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600 text-sm">
                            <li>Order number</li>
                            <li>Reason for return or exchange</li>
                            <li>Photos (if damaged or incorrect)</li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">2</span>
                        <p className="text-gray-700">Our support team will respond within <strong>1–2 business days</strong></p>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">3</span>
                        <p className="text-gray-700">Once approved, you&apos;ll receive return instructions</p>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Refunds */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">💰 Refunds</h2>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Refunds are issued to the <strong>original payment method</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Processing time: <strong>5–10 business days</strong> after return inspection</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Shipping fees are <strong>non-refundable</strong>, unless the return is due to our error</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Return Shipping */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">🚚 Return Shipping</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-gray-800 font-semibold mb-1">✅ FREE Return Shipping:</p>
                        <p className="text-gray-700 text-sm">Damaged, defective, or incorrect items</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-800 font-semibold mb-1">📦 Customer Responsibility:</p>
                        <p className="text-gray-700 text-sm">Customer-initiated returns (return shipping costs are the responsibility of the customer)</p>
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          📌 This approach aligns with leading U.S. ecommerce standards while remaining sustainable for our business.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Damaged or Defective Items */}
              <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 lg:p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">🐶 Damaged or Defective Items</h2>
                    <p className="text-gray-700 mb-4">If your item arrives damaged or defective:</p>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>Notify us within <strong>48 hours of delivery</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>We will offer a <strong>free replacement or full refund</strong>, no return required in most cases</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Commitment Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6 lg:p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">🤝 Our Commitment to You</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      We believe shopping for your pet should be easy, safe, and stress-free. Our team is always happy to help and will work with you to find the best solution.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4 mt-6">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Email</p>
                          <a href="mailto:support@petshiwu.com" className="text-sm text-primary-600 hover:underline">
                            support@petshiwu.com
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Support Hours</p>
                          <p className="text-sm text-gray-700">Monday–Friday, 9 AM–6 PM (EST)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy Updates */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <strong>⚠️ Policy Updates:</strong> PetShiwu reserves the right to update this policy at any time. Changes will be posted on this page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ReturnPolicy;

