import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Queens NY", "pet supplies Queens New York", "pet delivery Queens"
 * Completes the 5-borough coverage alongside Brooklyn, Manhattan, Bronx, Staten Island
 */
const PetSuppliesQueensNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-queens-ny"
    title="Same-Day Pet Supplies Queens — Order by 3 PM | Petshiwu"
    description="Same-day pet delivery in Queens from our Jackson Heights warehouse. Order by 3 PM weekdays (1 PM weekends), before 11 PM. Not a walk-in store. No autoship. Free over $49."
    h1="Same-Day Pet Supplies Across Queens, NY"
    introContent="Petshiwu packs in Jackson Heights and delivers tonight across Queens — Flushing, Astoria, Forest Hills, Jamaica. We are not a walk-in store. Order by 3 PM weekdays (1 PM weekends) for delivery before 11 PM. No autoship. Free over $49."
    problemPoints={[
      "Lugging heavy bags of pet food on the 7 train or the Q",
      "Local Queens pet stores with limited brand selection",
      "Can't find specialty diets or prescription food near you",
      "Running out of pet food on a busy weekday",
      "Big-box stores far from your neighborhood"
    ]}
    solutionPoints={[
      "Delivery to all Queens neighborhoods — Flushing, Astoria, Jackson Heights, Forest Hills, Jamaica, Bayside, Woodside, Elmhurst, Ridgewood, Howard Beach, and more",
      "10,000+ products for dogs, cats, birds, fish, reptiles, and small animals",
      "Top brands at fair prices — Purina, Blue Buffalo, Royal Canin, Hill's, Wellness, Iams, and more",
      "Free delivery on orders over $49 — no membership required",
      "Same-day: order by 3 PM weekdays (1 PM weekends), before 11 PM",
      "Jackson Heights warehouse — delivery only, not a walk-in store"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to Queens?",
        answer: "Yes! Petshiwu delivers to all Queens neighborhoods including Flushing, Astoria, Jackson Heights, Forest Hills, Rego Park, Jamaica, Bayside, Woodside, Elmhurst, Corona, Ridgewood, Ozone Park, Howard Beach, Far Rockaway, and everywhere in between."
      },
      {
        question: "How much does pet supply delivery cost in Queens?",
        answer: "Delivery is $6 for orders under $49. Orders over $49 get free delivery. Most orders of dog food or cat food easily hit the free delivery threshold — a single bag of kibble often qualifies."
      },
      {
        question: "What pet brands do you carry for Queens customers?",
        answer: "We stock all the top brands: Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet, Wellness, Orijen, Iams, Pedigree, Nutro, Nature's Recipe, and hundreds more. Over 10,000 products in total."
      },
      {
        question: "Can I get cat food delivered in Queens?",
        answer: "Absolutely. We carry hundreds of cat food options — dry food, wet food, grain-free, prescription diets, kitten food, senior cat food, and more. All delivered to your Queens address."
      },
      {
        question: "Do you deliver to Flushing and Jackson Heights?",
        answer: "Yes. Jackson Heights is our warehouse, not a shop you visit. Order by 3 PM weekdays (1 PM weekends) for delivery before 11 PM anywhere in Queens."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'dog treats', 'cat litter', 'bird food']}
  />
);

export default PetSuppliesQueensNY;
