import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies delivery NYC", "pet store delivery New York", "online pet store New York"
 * Captures the same intent as competitor brand searches — people want fast NYC pet supply delivery
 */
const PetSuppliesDeliveryNYC = () => {
  return (
    <SEOLandingPage
      keyword="pet-supplies-delivery-nyc"
      title="Pet Supplies Delivery NYC — Free Shipping Over $49 | Petshiwu"
      description="Get pet supplies delivered anywhere in NYC. Dogs, cats, birds, fish, reptiles — 10,000+ products from top brands. Free delivery on orders over $49. Queens, Brooklyn, Manhattan, Bronx, Staten Island."
      h1="Pet Supplies Delivery in New York City"
      introContent="Need pet food, toys, or supplies delivered fast in NYC? Petshiwu delivers premium pet products to every borough — Queens, Brooklyn, Manhattan, Bronx, and Staten Island. Shop 10,000+ products from trusted brands like Purina, Blue Buffalo, and Royal Canin, and get free delivery on orders over $49."
      problemPoints={[
        "Lugging heavy bags of pet food from a store",
        "Pet stores with limited selection or out-of-stock items",
        "Expensive delivery fees eating into your budget",
        "Waiting days for national online retailers to ship",
        "Finding specialty items for exotic pets like birds, fish, or reptiles"
      ]}
      solutionPoints={[
        "10,000+ products delivered to your NYC door",
        "Free delivery on all orders over $49",
        "All pet types covered — dogs, cats, birds, fish, reptiles, small pets",
        "Top brands: Purina, Blue Buffalo, Royal Canin, Hill's Science Diet and more",
        "Jackson Heights-based — serving all 5 NYC boroughs",
        "Easy reordering so you never run out of your pet's favorites"
      ]}
      faqItems={[
        {
          question: "Do you deliver pet supplies to all NYC boroughs?",
          answer: "Yes! Petshiwu delivers to all five New York City boroughs — Queens, Brooklyn, Manhattan, the Bronx, and Staten Island. We're based in Jackson Heights, Queens, and built specifically to serve NYC pet owners."
        },
        {
          question: "How much does pet supply delivery cost in NYC?",
          answer: "Delivery is $6 for orders under $49. Orders over $49 ship completely free. Most of our customers hit the free shipping threshold with a single order of pet food."
        },
        {
          question: "What pet supplies can I order for delivery in NYC?",
          answer: "Everything — dry food, wet food, treats, toys, leashes, beds, crates, litter, aquarium supplies, bird food, reptile supplies, grooming products, and health supplements. Over 10,000 products across all categories."
        },
        {
          question: "Do you carry supplies for pets other than dogs and cats?",
          answer: "Absolutely. Petshiwu stocks food and supplies for dogs, cats, birds, fish, reptiles, and small pets like hamsters, rabbits, and guinea pigs. NYC pet owners have diverse pets — we cover them all."
        },
        {
          question: "Are the products the same brands I'd find at major pet stores?",
          answer: "Yes. We carry the same trusted brands you know — Purina, Blue Buffalo, Royal Canin, Hill's Science Diet, Wellness, Orijen, Pedigree, and many more. Same quality, delivered to your door in NYC."
        }
      ]}
      searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'pet toys', 'dog treats', 'cat treats']}
      petType="dog"
    />
  );
};

export default PetSuppliesDeliveryNYC;
