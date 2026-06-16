import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "raw dog food NYC", "raw pet food delivery New York", "BARF diet dog food NYC"
 * High-intent buyers seeking raw/fresh feeding options in NYC
 */
const RawDogFoodNYC = () => {
  return (
    <SEOLandingPage
      keyword="raw-dog-food-nyc"
      title="Raw Dog Food NYC — Delivery to All 5 Boroughs | PetShiwu"
      description="Raw dog food delivered to NYC — Manhattan, Brooklyn, Queens, Bronx, Staten Island. Shop freeze-dried raw, air-dried raw, and raw-inspired formulas from top brands. Free delivery over $49."
      h1="Raw Dog Food Delivered in New York City"
      introContent="Raw feeding is one of the fastest-growing trends in pet nutrition — and for good reason. Dogs on raw and raw-inspired diets often show shinier coats, better digestion, healthier teeth, and higher energy levels. PetShiwu delivers freeze-dried raw, air-dried raw, and raw-inspired dog food to all five NYC boroughs with free shipping on orders over $49."
      problemPoints={[
        "Finding raw dog food in NYC requires trips to specialty stores far from home",
        "Carrying heavy frozen raw food packages on the subway or in an Uber",
        "Limited selection of raw brands at local pet stores",
        "Unclear which raw format — frozen, freeze-dried, air-dried — is right for your dog",
        "Concerns about safe handling and storage of raw meat in NYC apartments"
      ]}
      solutionPoints={[
        "Freeze-dried and air-dried raw dog food — no frozen storage required",
        "Raw-inspired formulas from top brands including Orijen and Wellness",
        "Free delivery to all 5 NYC boroughs on orders over $49",
        "Full ingredient transparency — you know exactly what your dog eats",
        "Apartment-friendly formats that are easy to store and serve",
        "Queens-based team that understands NYC pet owner needs"
      ]}
      faqItems={[
        {
          question: "What is the difference between frozen raw, freeze-dried raw, and air-dried raw dog food?",
          answer: "Frozen raw is minimally processed but requires freezer storage and thawing — challenging in small NYC apartments. Freeze-dried raw removes moisture through a cold vacuum process, preserving nutrients without refrigeration until opened. Air-dried raw uses low heat to slowly remove moisture, producing a shelf-stable product with similar nutritional density. Freeze-dried and air-dried are the most practical raw formats for NYC apartment living."
        },
        {
          question: "Is raw dog food safe?",
          answer: "Raw feeding carries some risk of bacterial contamination (Salmonella, Listeria) if handled improperly. Freeze-dried and air-dried formats significantly reduce this risk compared to fresh frozen raw. Always wash hands after serving, store properly, and consult your vet before switching — especially if you have young children, elderly family members, or immunocompromised people in your home."
        },
        {
          question: "What raw dog food brands do you carry?",
          answer: "We carry freeze-dried and raw-inspired formulas from Orijen, Wellness Core, Instinct, and other premium brands. Our selection focuses on high-protein, minimally processed options that align with raw feeding principles."
        },
        {
          question: "How do I transition my dog to raw food?",
          answer: "Transition slowly over 7–10 days. Start by mixing 25% new raw food with 75% current food. Gradually increase the ratio every 2–3 days. Some dogs transition easily; others experience loose stools during adjustment. Go slower if needed. Talk to your vet if your dog has a history of pancreatitis or digestive issues before switching."
        },
        {
          question: "Can you deliver raw dog food to Brooklyn, Manhattan, and the Bronx?",
          answer: "Yes — PetShiwu delivers to all five NYC boroughs including Manhattan, Brooklyn, Queens, the Bronx, and Staten Island. Orders over $49 ship free. Most orders arrive next day."
        }
      ]}
      searchTerms={['raw dog food', 'freeze dried raw dog food', 'BARF diet', 'raw pet food delivery', 'high protein dog food', 'grain free raw dog food']}
      petType="dog"
    />
  );
};

export default RawDogFoodNYC;
