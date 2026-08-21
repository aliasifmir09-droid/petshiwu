import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Jackson Heights", "pet store Jackson Heights NY", "pet food Jackson Heights Queens"
 * Home neighborhood — delivery from warehouse, not a walk-in shop.
 */
const PetSuppliesJacksonHeightsNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-jackson-heights-ny"
    title="Pet Supplies Jackson Heights NY — Local Delivery from Our Warehouse | Petshiwu"
    description="Petshiwu delivers pet supplies in Jackson Heights, Queens. We are not a walk-in store — office and warehouse only. Delivery to Jackson Heights, Elmhurst, Woodside & nearby. Free shipping over $49."
    h1="Jackson Heights Pet Supply Delivery"
    introContent="Petshiwu delivers pet food and supplies in Jackson Heights from our office and warehouse at 37-68 74th Street. We are not a walk-in store. Order online and we bring premium pet food, toys, and supplies to Jackson Heights, Elmhurst, Woodside, Corona, and all surrounding areas. 10,000+ products, free delivery on orders over $49."
    problemPoints={[
      "Having to travel to big pet stores outside the neighborhood",
      "Local stores with limited selection and inconsistent stock",
      "Specialty food for dogs, cats, birds, and exotic pets hard to find nearby",
      "Language barriers at some local stores",
      "Heavy bags on the 7 train or the bus"
    ]}
    solutionPoints={[
      "Jackson Heights warehouse — delivery only, not a walk-in shop",
      "Delivery throughout Jackson Heights, Elmhurst, Woodside, Corona, and beyond",
      "10,000+ products — the widest selection without leaving home",
      "Multilingual support reflecting Jackson Heights' diverse community",
      "Free delivery on orders over $49 — no more heavy bags",
      "Serving dogs, cats, birds, fish, reptiles, and small animals",
      "Top brands: Purina, Blue Buffalo, Royal Canin, Hill's Science Diet"
    ]}
    faqItems={[
      {
        question: "Can I visit Petshiwu in Jackson Heights?",
        answer: "No. We are not a walk-in store. 37-68 74th Street is our office and warehouse only. Shop online and we deliver to your door in Jackson Heights and across NYC."
      },
      {
        question: "Is Petshiwu based in Jackson Heights?",
        answer: "Yes — our office and warehouse are in Jackson Heights, Queens at 37-68 74th Street. We deliver from here across all 5 NYC boroughs."
      },
      {
        question: "Do you deliver to Jackson Heights and Elmhurst?",
        answer: "Yes — Jackson Heights and Elmhurst are our home turf. We deliver to all streets in both neighborhoods, plus Woodside, Corona, Flushing, Astoria, and all of Queens."
      },
      {
        question: "What's the phone number for Petshiwu in Jackson Heights?",
        answer: "You can reach us at (800) 259-2605 or by email at support@petshiwu.com. The call center is open 24/7."
      },
      {
        question: "Do you carry food for South Asian pets and bird species in Jackson Heights?",
        answer: "Yes — Jackson Heights has one of the most diverse pet owner communities in NYC. We stock food and supplies for parrots, finches, parakeets, and exotic birds, as well as a wide range of specialty pet foods. If you're looking for something specific, contact us and we'll help."
      },
      {
        question: "How long does delivery take to Jackson Heights?",
        answer: "We offer fast delivery within NYC. Since we warehouse in Jackson Heights, local orders are a priority. Free delivery on orders over $49."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'bird food', 'pet food', 'pet supplies', 'parrot food', 'dog treats']}
  />
);

export default PetSuppliesJacksonHeightsNY;
