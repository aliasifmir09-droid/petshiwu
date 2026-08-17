import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Manhattan", "pet store Manhattan NYC", "pet food delivery Manhattan"
 */
const PetSuppliesManhattanNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-manhattan-ny"
    title="Same-Day Pet Supplies Manhattan — Order by 3 PM | Petshiwu"
    description="Same-day pet delivery in Manhattan. Order by 3 PM weekdays (1 PM weekends), before 11 PM. UWS, Harlem, Chelsea, Tribeca. No autoship. Free over $49."
    h1="Same-Day Pet Supplies Across Manhattan, NYC"
    introContent="Petshiwu delivers pet food and supplies tonight across Manhattan — Upper West Side, Harlem, Hell's Kitchen, Chelsea, Tribeca. Order by 3 PM weekdays (1 PM weekends) for delivery before 11 PM. No autoship. Free over $49."
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
      "Same-day: order by 3 PM weekdays (1 PM weekends), before 11 PM. No autoship."
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
        answer: "Order by 3 PM weekdays (1 PM weekends) and we deliver before 11 PM. After cutoff, next day. No autoship. Enter your ZIP on the homepage to confirm."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'royal canin', 'hill science diet', 'dog treats']}
  />
);

export default PetSuppliesManhattanNY;
