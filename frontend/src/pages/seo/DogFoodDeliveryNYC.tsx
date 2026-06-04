import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "dog food delivery NYC", "dog food delivery New York", "buy dog food online NYC"
 */
const DogFoodDeliveryNYC = () => {
  return (
    <SEOLandingPage
      keyword="dog-food-delivery-nyc"
      title="Dog Food Delivery NYC — All Breeds & Diets | PetShiwu"
      description="Order dog food online and get it delivered anywhere in NYC. Dry food, wet food, grain-free, raw, puppy, senior — all top brands. Free delivery over $49. Queens, Brooklyn, Manhattan, Bronx."
      h1="Dog Food Delivery in New York City"
      introContent="Stop carrying heavy bags of dog food on the subway. PetShiwu delivers dog food directly to your NYC door — dry kibble, wet food, grain-free, raw diets, puppy formulas, and senior recipes. Shop Purina, Blue Buffalo, Royal Canin, Hill's Science Diet, Orijen, and more. Free delivery on orders over $49."
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
        "Free delivery on orders over $49 — one bag usually qualifies",
        "Delivery to all 5 NYC boroughs"
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
          answer: "You can easily reorder your dog's favorite food with just a few clicks from your order history. Set a reminder and reorder before you run out — no subscription required, no commitment."
        },
        {
          question: "Is dog food delivery available in Brooklyn and Manhattan?",
          answer: "Yes — we deliver to all five NYC boroughs: Queens, Brooklyn, Manhattan, the Bronx, and Staten Island. We're based in Jackson Heights and deliver throughout New York City."
        }
      ]}
      searchTerms={['dog food', 'kibble', 'dry dog food', 'wet dog food', 'grain free dog food', 'puppy food']}
      petType="dog"
      category="dog-food"
    />
  );
};

export default DogFoodDeliveryNYC;
