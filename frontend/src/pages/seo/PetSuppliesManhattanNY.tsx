import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Manhattan", "pet store Manhattan NYC", "pet food delivery Manhattan"
 */
const PetSuppliesManhattanNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-manhattan-ny"
    title="Pet Supplies Manhattan NYC — Delivery to Upper West Side, Harlem & All of Manhattan | Petshiwu"
    description="Manhattan pet supply delivery. Upper West Side, Upper East Side, Harlem, Hell's Kitchen, Chelsea, Tribeca & more. 10,000+ products, free shipping over $49. Top brands delivered fast."
    h1="Pet Supplies Delivered Across Manhattan, NYC"
    introContent="Petshiwu delivers premium pet food, toys, and accessories throughout Manhattan — from Inwood to the Financial District. Whether you're in the Upper West Side, Harlem, Hell's Kitchen, or Tribeca, we bring 10,000+ pet products straight to your door. Free delivery on orders over $49."
    problemPoints={[
      "Manhattan pet stores are expensive and have limited selection",
      "No car to carry heavy bags of pet food",
      "Small apartment makes storing large supplies difficult",
      "Busy NYC lifestyle leaves no time for pet store runs",
      "Specialty diets and brands hard to find locally"
    ]}
    solutionPoints={[
      "Delivery throughout Manhattan — Upper West Side, Upper East Side, Harlem, Midtown, Hell's Kitchen, Chelsea, Tribeca, Financial District and more",
      "10,000+ products including specialty and prescription diets",
      "Top brands — Purina, Royal Canin, Blue Buffalo, Hill's Science Diet",
      "Free delivery on orders over $49",
      "Compact packaging options for Manhattan apartments",
      "Easy repeat ordering — set it and forget it for monthly supplies"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to Manhattan?",
        answer: "Yes! Petshiwu delivers to all Manhattan neighborhoods including Upper West Side, Upper East Side, Harlem, East Harlem, Inwood, Washington Heights, Hell's Kitchen, Midtown, Chelsea, Gramercy, Kips Bay, Murray Hill, Tribeca, SoHo, Lower East Side, Financial District, and more."
      },
      {
        question: "Is pet food delivery expensive in Manhattan?",
        answer: "Not with Petshiwu. Delivery is just $6 for orders under $49, and completely free for orders $49 and above. Our prices are competitive — no Manhattan markup."
      },
      {
        question: "Do you carry Royal Canin and Hill's Science Diet in Manhattan?",
        answer: "Yes, we carry both Royal Canin and Hill's Science Diet in full, including breed-specific formulas, prescription/veterinary diets, and age-specific varieties. All delivered to your Manhattan address."
      },
      {
        question: "Can I get dog food delivered to Upper West Side?",
        answer: "Absolutely. We deliver to the Upper West Side and all Manhattan zip codes. Dog food, treats, toys, leashes, beds — everything your dog needs, delivered to your door."
      },
      {
        question: "What's the delivery time for Manhattan pet orders?",
        answer: "We offer fast NYC delivery. Place your order and we'll get it to you quickly. For exact delivery windows, check at checkout or contact our support team."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'royal canin', 'hill science diet', 'dog treats']}
  />
);

export default PetSuppliesManhattanNY;
