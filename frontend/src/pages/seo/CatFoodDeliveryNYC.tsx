import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "cat food delivery NYC", "buy cat food online New York", "cat supplies delivery NYC"
 */
const CatFoodDeliveryNYC = () => {
  return (
    <SEOLandingPage
      keyword="cat-food-delivery-nyc"
      title="Cat Food Delivery NYC — Dry, Wet & Specialty Diets | Petshiwu"
      description="Get cat food delivered anywhere in NYC. Dry, wet, grain-free, indoor, senior formulas from top brands. Free delivery over $49. Queens, Brooklyn, Manhattan, Bronx, Staten Island."
      h1="Cat Food Delivery in New York City"
      introContent="Get your cat's favorite food delivered to any NYC address — no more hauling bags home from the store. Petshiwu stocks thousands of cat food options: dry kibble, wet food, pate, shreds, grain-free, indoor cat formulas, kitten food, and senior recipes from all the top brands. Free delivery on orders over $49."
      problemPoints={[
        "Carrying heavy litter and cat food up multiple flights of stairs",
        "Your cat is picky and the local store doesn't have their preferred food",
        "Running low between shopping trips",
        "Finding specialty diets like urinary health or weight control formulas",
        "Delivery services that don't carry your cat's specific brand"
      ]}
      solutionPoints={[
        "Thousands of cat food options — dry, wet, pate, flaked, shreds, and more",
        "All top brands: Purina, Blue Buffalo, Royal Canin, Hill's, Wellness, Fancy Feast",
        "Specialty formulas: indoor, hairball, urinary, weight control, senior, kitten",
        "Grain-free, limited ingredient, and raw options available",
        "Free delivery on orders over $49 — stocking up is always free",
        "Delivers to all 5 NYC boroughs"
      ]}
      faqItems={[
        {
          question: "What cat food brands do you deliver in NYC?",
          answer: "We carry Purina ONE, Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet, Wellness, Fancy Feast, Friskies, Iams, Nutro, and many more — thousands of cat food products in total."
        },
        {
          question: "Do you have wet cat food available for delivery?",
          answer: "Yes, we carry a huge selection of wet cat food — pate, flaked, shreds, gravy varieties, and more. Perfect for picky cats or those who need extra hydration. Free delivery on orders over $49."
        },
        {
          question: "Do you carry Royal Canin breed-specific cat food?",
          answer: "Yes! Royal Canin makes breed-specific formulas for cats including Maine Coon, Persian, Siamese, and more. We stock a wide range of Royal Canin cat food for delivery in NYC."
        },
        {
          question: "Can I get cat litter delivered in NYC too?",
          answer: "Absolutely — we deliver cat litter along with all your cat supplies. Clumping, non-clumping, crystal, and natural litters from brands like Tidy Cats, Fresh Step, and more. Bundle with your cat food order for free delivery over $49."
        },
        {
          question: "Do you deliver cat food to apartments in Manhattan and Brooklyn?",
          answer: "Yes! We deliver to all five NYC boroughs — Queens, Brooklyn, Manhattan, the Bronx, and Staten Island. Perfect for apartment dwellers who don't want to carry heavy supplies up the stairs."
        }
      ]}
      searchTerms={['cat food', 'cat litter', 'kitten food', 'wet cat food', 'dry cat food', 'cat treats', 'cat supplies']}
      petType="cat"
      category="cat-food"
    />
  );
};

export default CatFoodDeliveryNYC;
