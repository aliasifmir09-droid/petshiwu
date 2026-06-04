import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "online pet store NYC", "best online pet store New York", "buy pet food online New York"
 * Broad national brand replacement intent
 */
const OnlinePetStoreNYC = () => {
  return (
    <SEOLandingPage
      keyword="online-pet-store-nyc"
      title="Online Pet Store NYC — 10,000+ Products, Free Delivery Over $49 | PetShiwu"
      description="New York City's premier online pet store. Shop 10,000+ products for dogs, cats, birds, fish, reptiles and more. Free delivery on orders over $49. Proudly serving all 5 NYC boroughs."
      h1="New York City's Online Pet Store"
      introContent="PetShiwu is the online pet store built for New York City. We know NYC — the apartments, the no-car lifestyle, the tight schedules. That's why we deliver 10,000+ premium pet products straight to your door anywhere in the five boroughs. Top brands, competitive prices, free delivery over $49. No warehouse somewhere in the Midwest — we're NYC, serving NYC."
      problemPoints={[
        "National online retailers that take days to ship to NYC",
        "No car to load up on heavy pet food and litter",
        "Paying $10-15 for 'same day' delivery on top of the product price",
        "Websites that don't specialize in your city or understand NYC pet owners",
        "Juggling multiple stores and websites for different pet types"
      ]}
      solutionPoints={[
        "NYC-based — we understand the city and its pet owners",
        "10,000+ products for every pet under one roof",
        "Free delivery on orders over $49 — no membership, no games",
        "Dogs, cats, birds, fish, reptiles, small pets — all covered",
        "Top brands you trust: Purina, Blue Buffalo, Royal Canin, Hill's Science Diet",
        "Easy search and reorder so you never run out"
      ]}
      faqItems={[
        {
          question: "Why shop at PetShiwu instead of a national online pet retailer?",
          answer: "PetShiwu is built specifically for NYC. We focus on fast local delivery, understand the needs of city pet owners, and are a local business reinvesting in the NYC community. You get the same top brands and competitive prices — with a local-first experience."
        },
        {
          question: "Do you have the same brands as large national pet stores?",
          answer: "Yes. We carry Purina, Blue Buffalo, Royal Canin, Hill's Science Diet, Wellness, Orijen, Acana, Pedigree, Iams, Fancy Feast, Friskies, and hundreds of other brands. Over 10,000 products in stock."
        },
        {
          question: "How fast is delivery in NYC?",
          answer: "We offer delivery throughout all five NYC boroughs. Shipping is $6 for orders under $49 and free for orders $49 and above. Contact us at support@petshiwu.com or call +1 (800) 259-2605 for delivery time estimates."
        },
        {
          question: "What kinds of pets do you support?",
          answer: "All of them — dogs, cats, birds, fish, reptiles, hamsters, rabbits, guinea pigs, ferrets, and more. NYC pet owners have all kinds of pets and we stock supplies for every one of them."
        },
        {
          question: "Is PetShiwu a local NYC business?",
          answer: "Yes — we're based in Jackson Heights, Queens, NYC. We're a local business serving local pet owners. Your order supports a New York City company, not a national chain."
        }
      ]}
      searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'pet toys', 'pet accessories', 'bird food', 'fish food']}
    />
  );
};

export default OnlinePetStoreNYC;
