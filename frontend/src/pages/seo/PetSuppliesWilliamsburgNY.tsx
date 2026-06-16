import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Williamsburg Brooklyn", "pet store Williamsburg NY", "pet food delivery Williamsburg"
 */
const PetSuppliesWilliamsburgNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-williamsburg-brooklyn-ny"
    title="Pet Supplies Williamsburg Brooklyn NY — Same-Day Delivery | Petshiwu"
    description="Pet supply delivery to Williamsburg, Brooklyn. Dog food, cat food, pet accessories delivered same-day to North Side, South Side, East Williamsburg & Greenpoint. 10,000+ products, free shipping over $49."
    h1="Pet Supplies Delivered to Williamsburg, Brooklyn"
    introContent="Petshiwu delivers premium pet food and supplies straight to your Williamsburg apartment. No car, no lugging bags on the L train — we bring everything from dry kibble to raw diets, litter, toys, and accessories right to your door. 10,000+ products from top brands, free delivery on orders over $49."
    problemPoints={[
      "Carrying heavy pet food bags on the L or G train",
      "Limited selection at local Williamsburg corner stores",
      "Specialty diets and premium brands hard to find nearby",
      "Pet stores in other neighborhoods require a schlep",
      "Expensive delivery fees from other services"
    ]}
    solutionPoints={[
      "Delivery to all Williamsburg streets — North Side, South Side, East Williamsburg, Greenpoint border",
      "10,000+ products: dog food, cat food, bird supplies, fish food, reptile care",
      "Premium brands: Purina Pro Plan, Blue Buffalo, Royal Canin, Orijen, Wellness",
      "Free delivery on orders over $49 — most pet food orders qualify",
      "Raw diets, grain-free, prescription food, and specialty diets in stock",
      "Same-day delivery available in Brooklyn — order by noon"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to Williamsburg, Brooklyn?",
        answer: "Yes — Petshiwu delivers to all of Williamsburg including the North Side, South Side, East Williamsburg, and the Greenpoint border area. Free delivery on orders over $49."
      },
      {
        question: "What is the delivery fee for pet supplies in Williamsburg?",
        answer: "Delivery is $6 for orders under $49. Orders over $49 ship free. A standard bag of dog food or two cans of cat food typically hits the free threshold."
      },
      {
        question: "Can I get raw or grain-free dog food delivered in Williamsburg?",
        answer: "Yes — we stock a wide range of grain-free, raw, and specialty diets. Brands include Orijen, Acana, Stella & Chewy's, and Merrick. Delivered to your Williamsburg address."
      },
      {
        question: "Do you carry cat litter delivery for Williamsburg apartments?",
        answer: "Absolutely. We carry all major cat litter brands — Tidy Cats, Dr. Elsey's, Arm & Hammer, World's Best Cat Litter, and more. Heavy litter bags delivered to your door — no more carrying them up the stairs."
      },
      {
        question: "How fast is pet supply delivery to Williamsburg?",
        answer: "We offer fast NYC delivery. Orders placed early in the day are typically delivered quickly. Check our site for current estimated delivery times to Williamsburg."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'cat litter', 'pet food', 'pet supplies', 'dog treats', 'raw dog food']}
  />
);

export default PetSuppliesWilliamsburgNY;
