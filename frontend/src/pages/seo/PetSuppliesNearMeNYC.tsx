import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies near me NYC", "pet store near me Queens", "pet food near me Jackson Heights"
 * Pure "near me" local intent — huge search volume
 */
const PetSuppliesNearMeNYC = () => {
  return (
    <SEOLandingPage
      keyword="pet-supplies-near-me-nyc"
      title="Pet Supplies Near Me — NYC Delivery to Your Door | PetShiwu"
      description="Looking for pet supplies near you in NYC? PetShiwu delivers to your door — Queens, Brooklyn, Manhattan, Bronx, Staten Island. 10,000+ products, free delivery over $49."
      h1="Pet Supplies Delivered Near You in NYC"
      introContent="Searching for pet supplies near you in New York City? PetShiwu brings the store to your door. Instead of finding a pet store nearby, we deliver 10,000+ products directly to your NYC address — whether you're in Queens, Brooklyn, Manhattan, the Bronx, or Staten Island. Free delivery on orders over $49."
      problemPoints={[
        "The nearest pet store is inconvenient or closed",
        "Limited selection at nearby stores",
        "Carrying supplies home without a car in NYC",
        "Not finding your pet's specific diet or brand locally",
        "Paying high prices at convenience-located pet stores"
      ]}
      solutionPoints={[
        "Delivered right to your door — closer than any store",
        "10,000+ products from every major brand",
        "All pets covered — dogs, cats, birds, fish, reptiles, small pets",
        "Free delivery on orders over $49",
        "No need to leave your apartment — order from your phone",
        "Serving all 5 NYC boroughs 7 days a week"
      ]}
      faqItems={[
        {
          question: "Is there a pet supply delivery service near me in NYC?",
          answer: "Yes — PetShiwu delivers pet supplies to all five NYC boroughs: Queens, Brooklyn, Manhattan, the Bronx, and Staten Island. We're based in Jackson Heights, Queens, and serve all of New York City."
        },
        {
          question: "Can I get same-day pet supply delivery in NYC?",
          answer: "Contact us at support@petshiwu.com or call +1 (800) 259-2605 for current delivery times in your area. We're always working to get your pets' supplies to you as quickly as possible."
        },
        {
          question: "What's the cheapest way to get pet supplies delivered in NYC?",
          answer: "Order $49 or more and delivery is completely free. Stock up on your pet's food, treats, and other necessities in one order and you'll always hit the free delivery threshold."
        },
        {
          question: "Do you have pet supplies for exotic pets near me in NYC?",
          answer: "Yes — we carry supplies for birds, fish, reptiles, small animals, and more. NYC has one of the most diverse pet communities in the country and we stock accordingly."
        },
        {
          question: "How do I find pet supplies for my specific breed or pet type?",
          answer: "Use our search bar or browse by pet type — Dog, Cat, Bird, Fish, Reptile, or Small Pet. You can also filter by brand, diet type, life stage, and more to find exactly what your pet needs."
        }
      ]}
      searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'pet toys', 'pet treats', 'litter']}
    />
  );
};

export default PetSuppliesNearMeNYC;
