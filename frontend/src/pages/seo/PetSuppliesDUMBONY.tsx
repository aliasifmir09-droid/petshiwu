import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies DUMBO Brooklyn", "pet store DUMBO NY", "pet food delivery DUMBO Brooklyn"
 */
const PetSuppliesDUMBONY = () => (
  <SEOLandingPage
    keyword="pet-supplies-dumbo-brooklyn-ny"
    title="Pet Supplies DUMBO Brooklyn NY — Delivery to Your Apartment | Petshiwu"
    description="Pet supply delivery to DUMBO, Brooklyn Heights, and Vinegar Hill. Premium dog food, cat food, and pet accessories delivered fast. 10,000+ products, free shipping over $49."
    h1="Pet Supplies Delivered to DUMBO & Brooklyn Heights"
    introContent="DUMBO's cobblestone streets and converted lofts are home to some of Brooklyn's most pampered pets. Petshiwu delivers premium pet food, supplements, and accessories directly to your DUMBO, Brooklyn Heights, or Vinegar Hill address — no car needed, no bags on the A train. Free delivery on orders over $49."
    problemPoints={[
      "Limited local pet stores in DUMBO and the immediate area",
      "Carrying bags through Brooklyn Bridge Park or on the subway",
      "Premium brands not stocked at neighborhood bodegas",
      "Specialty diets for urban pets difficult to source consistently",
      "High prices at boutique pet stores in the area"
    ]}
    solutionPoints={[
      "Delivery throughout DUMBO, Brooklyn Heights, Vinegar Hill, and Dumbo waterfront",
      "10,000+ products — the biggest selection without leaving your building",
      "Premium brands: Orijen, Wellness, Royal Canin, Blue Buffalo, Hill's",
      "Grain-free, raw, limited ingredient, and prescription diets available",
      "Free delivery on orders over $49",
      "Fast NYC delivery — order early, receive quickly"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to DUMBO, Brooklyn?",
        answer: "Yes — Petshiwu delivers to DUMBO, Brooklyn Heights, Vinegar Hill, and the surrounding waterfront area. Free delivery on orders over $49."
      },
      {
        question: "What pet food brands do you deliver to DUMBO?",
        answer: "We carry all major premium brands: Orijen, Acana, Wellness, Blue Buffalo, Royal Canin, Purina Pro Plan, Hill's Science Diet, and hundreds more. Over 10,000 products total."
      },
      {
        question: "Can I get cat supplies delivered to my DUMBO loft?",
        answer: "Absolutely — we carry cat food, cat litter, scratching posts, beds, toys, and all accessories. Whether you have one cat or three, we've got your supplies covered with delivery to your DUMBO address."
      },
      {
        question: "Do you deliver near Brooklyn Bridge Park?",
        answer: "Yes — our delivery zone covers DUMBO and Brooklyn Heights, which includes the residential buildings near Brooklyn Bridge Park. Order online and we'll bring it to you."
      },
      {
        question: "How much does pet delivery cost in DUMBO?",
        answer: "Delivery is $6 for orders under $49. Orders over $49 ship free. Most premium food orders reach the free threshold easily."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'pet supplies', 'cat litter', 'dog treats', 'premium pet food', 'pet accessories']}
  />
);

export default PetSuppliesDUMBONY;
