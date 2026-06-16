import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Upper West Side NYC", "pet store Upper West Side Manhattan", "dog food delivery UWS"
 */
const PetSuppliesUpperWestSideNYC = () => (
  <SEOLandingPage
    keyword="pet-supplies-upper-west-side-nyc"
    title="Pet Supplies Upper West Side NYC — Delivery to Your Manhattan Apartment | Petshiwu"
    description="Pet supply delivery to the Upper West Side, Manhattan. Premium dog food, cat food, and pet accessories delivered to your UWS apartment. Central Park dog owners love us. 10,000+ products, free shipping over $49."
    h1="Pet Supplies Delivered to the Upper West Side, Manhattan"
    introContent="The Upper West Side is one of Manhattan's most dog-friendly neighborhoods — from Riverside Park to Central Park West, UWS pet owners take their animals seriously. Petshiwu delivers premium pet food, supplements, toys, and accessories right to your doorman building or walk-up. Skip the elevator + bags combo and let us bring it to you. Free delivery on orders over $49."
    problemPoints={[
      "Hauling heavy pet food bags through the subway or from garage parking",
      "Local UWS pet stores with boutique pricing",
      "Premium brands not always in stock nearby",
      "Doorman buildings make outside deliveries complicated — ours are clean and labeled",
      "Specialty diets for Manhattan dogs hard to source consistently"
    ]}
    solutionPoints={[
      "Delivery throughout the Upper West Side, Morningside Heights, and Lincoln Square",
      "10,000+ products from premium and specialty brands",
      "Purina Pro Plan, Royal Canin, Hill's Science Diet, Orijen, Blue Buffalo, and more",
      "Grain-free, raw, prescription diets, and senior formulas all available",
      "Free delivery on orders over $49 — no boutique markup",
      "Perfect for Central Park dog walkers: bulk treats, leashes, harnesses, and more"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to the Upper West Side?",
        answer: "Yes — Petshiwu delivers throughout the Upper West Side from 59th to 110th Street, including Central Park West, Riverside Drive, Broadway, Amsterdam Ave, and Columbus Ave. Free delivery on orders over $49."
      },
      {
        question: "What premium pet food brands do you carry for UWS delivery?",
        answer: "We carry all premium brands: Royal Canin, Hill's Science Diet, Orijen, Acana, Wellness, Blue Buffalo, Purina Pro Plan, and many more. Over 10,000 products across dogs, cats, birds, and small animals."
      },
      {
        question: "Can I get dog supplies for Central Park walks delivered to the Upper West Side?",
        answer: "Absolutely — we carry everything you need: leashes, harnesses, collars, poop bags, portable water bottles, dog treats, and toys. All delivered to your UWS address."
      },
      {
        question: "Do you deliver to doorman buildings on the Upper West Side?",
        answer: "Yes — our deliveries work with doorman buildings. You can add delivery instructions at checkout. We package orders clearly so your doorman can accept them on your behalf."
      },
      {
        question: "How much does pet delivery cost on the Upper West Side?",
        answer: "Delivery is $6 for orders under $49. Orders over $49 ship free. Most premium pet food orders easily reach the free delivery threshold."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'premium pet food', 'dog harness', 'cat litter', 'dog treats', 'pet supplies']}
  />
);

export default PetSuppliesUpperWestSideNYC;
