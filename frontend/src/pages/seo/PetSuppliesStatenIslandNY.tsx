import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Staten Island", "pet store Staten Island NY", "pet food delivery Staten Island"
 */
const PetSuppliesStatenIslandNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-staten-island-ny"
    title="Pet Supplies Staten Island NY — Delivery to St. George, Tottenville & All of Staten Island | Petshiwu"
    description="Staten Island pet supply delivery. St. George, Tottenville, New Dorp, Stapleton & all neighborhoods. 10,000+ products from top brands. Free shipping on orders over $49."
    h1="Pet Supplies Delivered Across Staten Island, NY"
    introContent="Petshiwu delivers premium pet food, toys, and accessories to every neighborhood on Staten Island. From St. George to Tottenville, New Dorp to Stapleton — shop 10,000+ products and get them delivered to your door. Free delivery on orders over $49."
    problemPoints={[
      "Limited pet store variety compared to other NYC boroughs",
      "Having to drive to big-box stores for specialty items",
      "Specific brands and formulas not available locally",
      "Carrying heavy supplies in the car or on the ferry",
      "Inconsistent stock at local stores"
    ]}
    solutionPoints={[
      "Delivery to all Staten Island neighborhoods — St. George, New Dorp, Tottenville, Stapleton, Richmond, Eltingville, Great Kills, and more",
      "10,000+ products for every type of pet",
      "All top national brands at competitive prices",
      "Free delivery on orders $49+ — saves on gas too",
      "Consistent stock — never backordered on the basics",
      "Easy online ordering anytime"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to Staten Island?",
        answer: "Yes! Petshiwu delivers to all Staten Island neighborhoods including St. George, Stapleton, New Dorp, Tottenville, Richmond, Eltingville, Great Kills, Annadale, Rossville, Woodrow, and more."
      },
      {
        question: "Is there free delivery to Staten Island?",
        answer: "Yes — orders over $49 ship free to Staten Island. Orders under $49 are just $6. A standard bag of dog food or cat food easily hits the free delivery threshold."
      },
      {
        question: "What pet supplies can I order for delivery to Staten Island?",
        answer: "Everything — dog food, cat food, dog treats, cat litter, bird seed, fish supplies, reptile food, small animal bedding, pet toys, leashes, collars, beds, carriers, and much more. Over 10,000 products available."
      },
      {
        question: "Do you deliver premium dog food brands to Staten Island?",
        answer: "Yes — we carry Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet, Wellness, Orijen, and many more premium brands, all delivered to your Staten Island home."
      },
      {
        question: "How fast is delivery to Staten Island?",
        answer: "We offer fast NYC delivery to all Staten Island zip codes. Place your order and we'll get it to you quickly. Contact support@petshiwu.com for specific delivery window questions."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'dog treats', 'cat litter', 'pet toys']}
  />
);

export default PetSuppliesStatenIslandNY;
