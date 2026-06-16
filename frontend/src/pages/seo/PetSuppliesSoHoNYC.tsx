import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies SoHo NYC", "pet store SoHo Manhattan", "luxury pet supplies SoHo New York"
 */
const PetSuppliesSoHoNYC = () => (
  <SEOLandingPage
    keyword="pet-supplies-soho-nyc"
    title="Pet Supplies SoHo NYC — Premium Delivery to Your Manhattan Loft | Petshiwu"
    description="Pet supply delivery to SoHo, Tribeca, NoHo, and Lower Manhattan. Luxury and premium dog food, cat food, and pet accessories delivered to your SoHo loft. 10,000+ products, free shipping over $49."
    h1="Premium Pet Supplies Delivered to SoHo, NYC"
    introContent="SoHo's cast-iron lofts and boutique streets are home to discerning pet owners who won't settle for average. Petshiwu delivers the same premium pet food and accessories you'd find in the best specialty stores — straight to your SoHo, Tribeca, or NoHo address. No overpriced boutiques, no schlep. Free delivery on orders over $49."
    problemPoints={[
      "Boutique SoHo pet stores charging premium prices for standard products",
      "Limited selection of specialty diets and niche brands in the area",
      "Navigating SoHo crowds with heavy pet food bags",
      "Subscription boxes that lock you into products your pet won't eat",
      "Inconsistent stock of premium and specialty brands locally"
    ]}
    solutionPoints={[
      "Delivery to SoHo, Tribeca, NoHo, Little Italy, and Lower Manhattan",
      "Premium and luxury brands at competitive prices — no boutique markup",
      "10,000+ products: raw diets, grain-free, limited ingredient, prescription food",
      "Orijen, Acana, Stella & Chewy's, Wellness, Royal Canin, and more",
      "Free delivery on orders over $49",
      "Order what your pet actually eats — no subscription lock-in"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to SoHo, Manhattan?",
        answer: "Yes — Petshiwu delivers throughout SoHo, Tribeca, NoHo, Little Italy, and the surrounding Lower Manhattan neighborhoods. Free delivery on orders over $49."
      },
      {
        question: "Do you carry luxury or premium pet food for SoHo delivery?",
        answer: "Yes — we carry a wide range of premium and specialty brands including Orijen, Acana, Stella & Chewy's, Wellness, Merrick, and more. The same quality you'd find at boutique stores, at better prices."
      },
      {
        question: "Can I get raw pet food delivered to SoHo?",
        answer: "Yes — we carry freeze-dried raw and frozen raw pet food options. Brands like Stella & Chewy's offer convenient raw diets that work well for loft living without a large freezer."
      },
      {
        question: "Do you deliver to Tribeca from SoHo?",
        answer: "Yes — Tribeca is part of our delivery zone. Same great selection, same delivery pricing: $6 under $49, free over $49."
      },
      {
        question: "What makes Petshiwu different from boutique SoHo pet stores?",
        answer: "We carry the same premium brands at better prices with home delivery. No boutique markup — just 10,000+ products from top brands delivered to your Manhattan address."
      }
    ]}
    searchTerms={['luxury dog food', 'premium cat food', 'raw dog food', 'grain-free pet food', 'dog supplies', 'cat supplies', 'pet accessories']}
  />
);

export default PetSuppliesSoHoNYC;
