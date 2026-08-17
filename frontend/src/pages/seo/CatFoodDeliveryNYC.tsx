import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "cat food delivery NYC", "buy cat food online New York", "cat supplies delivery NYC"
 */
const CatFoodDeliveryNYC = () => {
  return (
    <SEOLandingPage
      keyword="cat-food-delivery-nyc"
      title="Same-Day Cat Food Delivery NYC — Order by 3 PM | Petshiwu"
      description="Same-day cat food delivery in NYC. Order by 3 PM weekdays (1 PM weekends), before 11 PM. No autoship. Free over $49. Dry, wet, and specialty diets. All 5 boroughs."
      h1="Same-Day Cat Food Delivery in New York City"
      introContent="Get your cat's food delivered tonight — no hauling bags up the stairs. Order by 3 PM weekdays (1 PM weekends) and we deliver before 11 PM. Dry, wet, grain-free, indoor, kitten, and senior from Purina, Blue Buffalo, Royal Canin, Hill's, and Fancy Feast. No autoship. Free over $49."
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
        "Same-day NYC: order by 3 PM weekdays (1 PM weekends), before 11 PM",
        "No autoship. Free delivery over $49 — stocking up is always free",
        "Delivers to all 5 NYC boroughs from our Queens warehouse"
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
          answer: "Yes — all five boroughs. Order by 3 PM weekdays (1 PM weekends) for delivery before 11 PM. No walk-in store. Perfect if you do not want to carry litter up the stairs."
        }
      ]}
      searchTerms={['cat food', 'cat litter', 'kitten food', 'wet cat food', 'dry cat food', 'cat treats', 'cat supplies']}
      petType="cat"
      category="cat-food"
    />
  );
};

export default CatFoodDeliveryNYC;
