import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Brooklyn NY", "pet store Brooklyn", "pet food delivery Brooklyn"
 */
const PetSuppliesBrooklynNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-brooklyn-ny"
    title="Same-Day Pet Supplies Brooklyn — Order by 3 PM | Petshiwu"
    description="Same-day pet delivery in Brooklyn. Order by 3 PM weekdays (1 PM weekends), before 11 PM. Williamsburg, Park Slope, Bushwick, Bay Ridge. No autoship. Free over $49."
    h1="Same-Day Pet Supplies Across Brooklyn, NY"
    introContent="Petshiwu delivers pet food and supplies tonight across Brooklyn — Williamsburg, Park Slope, Bushwick, Flatbush, Bay Ridge. Order by 3 PM weekdays (1 PM weekends) for delivery before 11 PM. No autoship. 10,000+ products. Free over $49."
    problemPoints={[
      "Long subway rides carrying heavy bags of pet food",
      "Local Brooklyn pet stores with limited selection",
      "Can't find specialty food for your pet's specific needs",
      "Out of stock on your pet's preferred brand",
      "Expensive pet boutiques in trendy Brooklyn neighborhoods"
    ]}
    solutionPoints={[
      "Delivery to all Brooklyn neighborhoods — Williamsburg, Park Slope, Bushwick, Crown Heights, Bay Ridge, Flatbush, Bensonhurst, and more",
      "10,000+ products for dogs, cats, birds, fish, reptiles, and small animals",
      "Top brands at fair prices — Purina, Blue Buffalo, Royal Canin, Hill's and more",
      "Free delivery on orders over $49 — no membership needed",
      "Same-day: order by 3 PM weekdays (1 PM weekends), before 11 PM",
      "No autoship — reorder when you want"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to Brooklyn?",
        answer: "Yes! Petshiwu delivers to all Brooklyn neighborhoods including Williamsburg, DUMBO, Park Slope, Crown Heights, Flatbush, Bushwick, Bay Ridge, Bensonhurst, Sheepshead Bay, Brighton Beach, Coney Island, and everywhere in between."
      },
      {
        question: "How much does pet food delivery cost in Brooklyn?",
        answer: "Delivery is $6 for orders under $49. Orders over $49 get free delivery. Most orders of dog food or cat food easily hit the free delivery threshold — a bag of kibble alone often qualifies."
      },
      {
        question: "What pet brands do you carry for Brooklyn customers?",
        answer: "We stock all the top brands: Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet, Wellness, Orijen, Iams, Pedigree, Nutro, and hundreds more. Over 10,000 products in total."
      },
      {
        question: "Can I get cat food delivered in Brooklyn?",
        answer: "Absolutely. We carry hundreds of cat food options — dry food, wet food, grain-free, prescription diets, kitten food, senior cat food, and more. All delivered to your Brooklyn door."
      },
      {
        question: "Do you deliver to Park Slope and Williamsburg?",
        answer: "Yes — Park Slope, Williamsburg, and all Brooklyn ZIPs. Order by 3 PM weekdays (1 PM weekends) for delivery before 11 PM. No autoship."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'dog treats', 'cat litter', 'bird food']}
  />
);

export default PetSuppliesBrooklynNY;
