import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Long Island City Queens", "pet store LIC NY", "pet food delivery Long Island City"
 */
const PetSuppliesLongIslandCityNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-long-island-city-queens-ny"
    title="Same-Day Pet Supplies Long Island City — Order by 3 PM | Petshiwu"
    description="Same-day pet delivery in Long Island City. Order by 3 PM weekdays (1 PM weekends), before 11 PM. LIC, Hunters Point, Sunnyside. No autoship. Free over $49."
    h1="Same-Day Pet Supplies in Long Island City, Queens"
    introContent="Petshiwu delivers tonight to Long Island City high-rises — LIC, Hunters Point, Sunnyside, Woodside. Order by 3 PM weekdays (1 PM weekends) for delivery before 11 PM. Not a walk-in store. No autoship. Free over $49."
    problemPoints={[
      "Getting heavy pet food to high-rise apartments in LIC without a car",
      "Limited specialty pet stores in the immediate neighborhood",
      "Premium brands inconsistently stocked in local shops",
      "Having to cross the bridge into Manhattan just for pet supplies",
      "Expensive delivery fees from national services"
    ]}
    solutionPoints={[
      "Queens-based delivery — we're right across the Queensboro Bridge",
      "Delivery to LIC, Hunters Point, Sunnyside, Woodside, and Astoria",
      "10,000+ products from premium brands at competitive prices",
      "Purina, Blue Buffalo, Royal Canin, Hill's, Orijen, Wellness, and more",
      "Free delivery on orders over $49",
      "Dogs, cats, birds, fish, reptiles, and small animals all covered"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to Long Island City?",
        answer: "Yes — Petshiwu delivers throughout Long Island City including Hunters Point, the waterfront high-rises, and surrounding Queens neighborhoods like Sunnyside and Woodside. Free delivery on orders over $49."
      },
      {
        question: "How fast is pet supply delivery to LIC?",
        answer: "We offer fast NYC delivery. Since we're based in Queens, LIC is close to our operation. Orders placed early in the day are delivered quickly."
      },
      {
        question: "What dog food brands do you carry for LIC delivery?",
        answer: "We carry all top brands: Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet, Orijen, Wellness, Merrick, and hundreds more. Over 10,000 products in total."
      },
      {
        question: "Can I get pet supplies delivered to a high-rise in Long Island City?",
        answer: "Absolutely — we deliver to all LIC addresses including high-rise apartments. Add delivery instructions at checkout for doorman buildings or specific drop-off points."
      },
      {
        question: "Do you also deliver to Sunnyside and Woodside from LIC?",
        answer: "Yes — our Queens delivery zone includes Sunnyside, Woodside, Jackson Heights, Elmhurst, and all of western Queens. One order, fast delivery."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'cat litter', 'dog treats', 'bird food']}
  />
);

export default PetSuppliesLongIslandCityNY;
