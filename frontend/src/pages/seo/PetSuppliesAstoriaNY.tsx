import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Astoria Queens", "pet store Astoria NY", "pet food delivery Astoria Queens"
 */
const PetSuppliesAstoriaNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-astoria-queens-ny"
    title="Pet Supplies Astoria Queens NY — Local Delivery | Petshiwu"
    description="Pet supply delivery to Astoria, Queens. Dog food, cat food, and pet accessories delivered to Astoria, Long Island City, Ditmars, and Steinway. Queens-based service. 10,000+ products, free shipping over $49."
    h1="Pet Supplies Delivered Across Astoria, Queens"
    introContent="Astoria is one of Queens' most beloved neighborhoods — and its pet owners are passionate. Petshiwu is Queens-based and delivers premium pet food, toys, and supplies throughout Astoria, from Ditmars Boulevard to Steinway Street. Local service, big selection, free delivery on orders over $49."
    problemPoints={[
      "Limited specialty pet stores in Astoria with full brand selection",
      "Carrying heavy bags from the N or W train",
      "Premium brands not consistently stocked at local shops",
      "Having to go to other neighborhoods for specialty diets",
      "Expensive national delivery services with long waits"
    ]}
    solutionPoints={[
      "Queens-based delivery — Astoria is part of our home territory",
      "Delivery to Ditmars, Steinway, Astoria Park area, and all Astoria neighborhoods",
      "10,000+ products from premium and everyday brands",
      "Purina, Blue Buffalo, Royal Canin, Hill's, Orijen, Iams, and more",
      "Free delivery on orders over $49",
      "Dogs, cats, birds, fish, reptiles, and small animals all covered"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to Astoria, Queens?",
        answer: "Yes — Petshiwu delivers throughout Astoria including Ditmars, Steinway, Astoria Park, and all surrounding streets. We're Queens-based so Astoria is right in our backyard. Free delivery on orders over $49."
      },
      {
        question: "How fast is pet supply delivery to Astoria?",
        answer: "We offer fast NYC delivery throughout Queens. Since we're based in Jackson Heights, Astoria is nearby. Orders are delivered quickly — check our site for current estimated delivery times."
      },
      {
        question: "Do you carry bird food and supplies for Astoria delivery?",
        answer: "Yes — Astoria has a large community of bird and parrot owners. We carry a wide range of bird food, seed mixes, pellets, cages, toys, and accessories for parrots, parakeets, finches, canaries, and more."
      },
      {
        question: "What dog food brands do you deliver to Astoria?",
        answer: "We carry all the top brands: Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet, Orijen, Wellness, Merrick, Iams, Pedigree, and many more. Over 10,000 products in total."
      },
      {
        question: "Do you deliver near Astoria Park?",
        answer: "Yes — our delivery zone covers the entire Astoria neighborhood including streets near Astoria Park. Perfect for stocking up on dog treats, leashes, and food for your park visits."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'bird food', 'pet food', 'pet supplies', 'parrot food', 'dog treats', 'cat litter']}
  />
);

export default PetSuppliesAstoriaNY;
