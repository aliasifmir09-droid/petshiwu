import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Park Slope Brooklyn", "pet store Park Slope NY", "dog food delivery Park Slope"
 */
const PetSuppliesParkSlopeNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-park-slope-brooklyn-ny"
    title="Pet Supplies Park Slope Brooklyn NY — Delivery to Your Door | Petshiwu"
    description="Pet supply delivery to Park Slope, Brooklyn. Premium dog food, cat food, organic and natural pet products delivered to your Park Slope home. 10,000+ products, free shipping over $49."
    h1="Premium Pet Supplies Delivered to Park Slope, Brooklyn"
    introContent="Park Slope is one of Brooklyn's most pet-friendly neighborhoods — and Petshiwu is here to keep those pets well-fed and happy without a single trip to the store. We deliver premium, natural, and organic pet food and supplies directly to your Park Slope brownstone or apartment. Free delivery on orders over $49."
    problemPoints={[
      "Premium and organic pet food hard to find at affordable prices locally",
      "Carrying heavy bags back from Prospect Park-adjacent pet stores",
      "Inconsistent stock at neighborhood shops",
      "Limited raw and prescription diet options nearby",
      "Paying too much for boutique local pet stores"
    ]}
    solutionPoints={[
      "Delivery throughout Park Slope, Gowanus, Windsor Terrace, and Prospect Heights",
      "Organic, natural, and premium brands at competitive prices",
      "10,000+ products: raw diets, grain-free, prescription food, natural treats",
      "Top brands: Orijen, Wellness, Blue Buffalo, Royal Canin, Hill's Science Diet",
      "Free delivery on orders over $49 — no boutique markup",
      "Dogs, cats, birds, fish, and small animals all covered"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to Park Slope, Brooklyn?",
        answer: "Yes — Petshiwu delivers to all of Park Slope including 5th Avenue, 7th Avenue, and side streets throughout the neighborhood. Also covers Gowanus, Windsor Terrace, and Prospect Heights. Free delivery on orders over $49."
      },
      {
        question: "Do you carry organic or natural pet food for Park Slope?",
        answer: "Yes — we stock a wide range of organic, natural, and holistic pet food brands. Orijen, Acana, Wellness, Merrick, and many more. Perfect for health-conscious Park Slope pet parents."
      },
      {
        question: "What dog food brands do you carry for delivery to Park Slope?",
        answer: "We carry all major brands: Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet, Orijen, Acana, Wellness, Merrick, Nutro, and many more. Over 10,000 products total."
      },
      {
        question: "Can I get prescription pet food delivered to Park Slope?",
        answer: "Yes — we carry prescription and veterinary diet foods from Hill's, Royal Canin, and Purina Pro Plan. These are available for dogs and cats with specific health needs."
      },
      {
        question: "How much does pet food delivery cost in Park Slope?",
        answer: "Delivery is $6 for orders under $49. Orders over $49 ship free. A single bag of premium dry dog food typically hits the free threshold."
      }
    ]}
    searchTerms={['organic dog food', 'natural cat food', 'premium pet food', 'dog food', 'cat food', 'pet supplies', 'grain-free dog food']}
  />
);

export default PetSuppliesParkSlopeNY;
