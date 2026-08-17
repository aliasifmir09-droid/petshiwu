import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "dog food delivery NYC", "dog food delivery New York", "buy dog food online NYC"
 */
const DogFoodDeliveryNYC = () => {
  return (
    <SEOLandingPage
      keyword="dog-food-delivery-nyc"
      title="Same-Day Dog Food Delivery NYC — Order by 3 PM | Petshiwu"
      description="Same-day dog food delivery in NYC. Order by 3 PM weekdays (1 PM weekends), at your door before 11 PM. No autoship. Free over $49. All 5 boroughs."
      h1="Same-Day Dog Food Delivery in New York City"
      introContent="Stop carrying heavy bags of dog food on the subway. Petshiwu delivers dog food to your NYC door tonight when you order by 3 PM weekdays (1 PM weekends) — dry kibble, wet food, grain-free, raw, puppy, and senior. Purina, Blue Buffalo, Royal Canin, Hill's, Orijen. No autoship. Free delivery over $49."
      problemPoints={[
        "Carrying 30-pound bags of dog food on the subway or in a cab",
        "Running out of food and making last-minute trips",
        "Limited selection at local bodegas or pet stores",
        "Not finding the specific diet your vet recommended",
        "Expensive delivery fees for large or heavy orders"
      ]}
      solutionPoints={[
        "Every major dog food brand — Purina, Blue Buffalo, Royal Canin, Hill's, Orijen, Wellness",
        "All diet types — standard, grain-free, limited ingredient, raw, freeze-dried",
        "All life stages — puppy, adult, senior, and all-life-stages formulas",
        "Dry kibble and wet/canned food available",
        "Same-day NYC: order by 3 PM weekdays (1 PM weekends), before 11 PM",
        "No autoship — buy once. Free delivery over $49 — one bag usually qualifies",
        "Delivery to all 5 NYC boroughs from our Queens warehouse"
      ]}
      faqItems={[
        {
          question: "What dog food brands do you carry?",
          answer: "We stock all the top brands: Purina Pro Plan, Purina ONE, Blue Buffalo, Royal Canin, Hill's Science Diet, Wellness, Orijen, Acana, Nutro, Pedigree, Iams, Nature's Recipe, and many more. Over 1,000 dog food products available."
        },
        {
          question: "Do you have grain-free dog food options?",
          answer: "Yes, we carry a wide range of grain-free dog foods from brands like Orijen, Acana, Blue Buffalo Wilderness, Merrick Grain Free, and Wellness CORE. Filter by diet type on our site to find grain-free options quickly."
        },
        {
          question: "Can I get puppy food delivered in NYC?",
          answer: "Absolutely. We carry puppy formulas for all breeds and sizes — small breed puppy, large breed puppy, and all-breed puppy foods from every major brand. Free delivery on orders over $49."
        },
        {
          question: "Do you offer subscription or repeat delivery for dog food?",
          answer: "No autoship. Reorder from your order history when you want. No subscription, no commitment. Same-day if you order by 3 PM weekdays (1 PM weekends)."
        },
        {
          question: "Is dog food delivery available in Brooklyn and Manhattan?",
          answer: "Yes — all five boroughs. Order by 3 PM weekdays (1 PM weekends) for delivery before 11 PM. Jackson Heights is our warehouse, not a walk-in store."
        }
      ]}
      searchTerms={['dog food', 'kibble', 'dry dog food', 'wet dog food', 'grain free dog food', 'puppy food']}
      petType="dog"
      category="dog-food"
    />
  );
};

export default DogFoodDeliveryNYC;
