import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies near me NYC", "pet store near me Queens", "pet food near me Jackson Heights"
 * Pure "near me" local intent — huge search volume
 */
const PetSuppliesNearMeNYC = () => {
  return (
    <SEOLandingPage
      keyword="pet-supplies-near-me-nyc"
      title="Pet Supplies Near Me NYC — Same-Day Delivery, Not a Store | Petshiwu"
      description="Pet supplies near you in NYC means delivery to your door. Order by 3 PM weekdays (1 PM weekends), before 11 PM. Not a walk-in store. No autoship. Free over $49."
      h1="Pet Supplies Near You — Delivered Tonight in NYC"
      introContent="Searching pet supplies near me in NYC? We do not have a walk-in shop. We deliver 10,000+ products to your door tonight if you order by 3 PM weekdays (1 PM weekends). All 5 boroughs. No autoship. Free over $49."
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
          answer: "Yes — Petshiwu delivers pet supplies to all five NYC boroughs: Queens, Brooklyn, Manhattan, the Bronx, and Staten Island. We warehouse in Jackson Heights, Queens. We are not a walk-in store."
        },
        {
          question: "Can I get same-day pet supply delivery in NYC?",
          answer: "Yes. Order by 3 PM EST weekdays (1 PM weekends) and we deliver before 11 PM the same day. After cutoff, next day. Enter your ZIP on the homepage. No autoship."
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
