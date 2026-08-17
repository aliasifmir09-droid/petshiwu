import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "online pet store NYC", "best online pet store New York", "buy pet food online New York"
 * Broad national brand replacement intent
 */
const OnlinePetStoreNYC = () => {
  return (
    <SEOLandingPage
      keyword="online-pet-store-nyc"
      title="Online Pet Store NYC — Same-Day Delivery, No Autoship | Petshiwu"
      description="NYC online pet store with same-day delivery. Order by 3 PM weekdays (1 PM weekends), before 11 PM. Not a walk-in store. No autoship. Free over $49. All 5 boroughs."
      h1="NYC's Online Pet Store — Delivered Tonight"
      introContent="Petshiwu is the online pet store built for New York City apartments and no-car life. Order by 3 PM weekdays (1 PM weekends) and we deliver before 11 PM to all five boroughs. We are not a walk-in store. No autoship. 10,000+ products. Free over $49. Packed in Queens, not a warehouse in the Midwest."
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
          question: "Why shop at Petshiwu instead of a national online pet retailer?",
          answer: "Petshiwu is built specifically for NYC. We focus on fast local delivery, understand the needs of city pet owners, and are a local business reinvesting in the NYC community. You get the same top brands and competitive prices — with a local-first experience."
        },
        {
          question: "Do you have the same brands as large national pet stores?",
          answer: "Yes. We carry Purina, Blue Buffalo, Royal Canin, Hill's Science Diet, Wellness, Orijen, Acana, Pedigree, Iams, Fancy Feast, Friskies, and hundreds of other brands. Over 10,000 products in stock."
        },
        {
          question: "How fast is delivery in NYC?",
          answer: "Same-day if you order by 3 PM weekdays (1 PM weekends) — at the door before 11 PM. After cutoff, next day. $6 under $49, free over $49. No autoship. Call (800) 259-2605 if you need help."
        },
        {
          question: "What kinds of pets do you support?",
          answer: "All of them — dogs, cats, birds, fish, reptiles, hamsters, rabbits, guinea pigs, ferrets, and more. NYC pet owners have all kinds of pets and we stock supplies for every one of them."
        },
        {
          question: "Is Petshiwu a local NYC business?",
          answer: "Yes — our office and warehouse are in Jackson Heights, Queens. We are delivery only, not a walk-in store. Your order supports a New York City company, not a national chain."
        }
      ]}
      searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'pet toys', 'pet accessories', 'bird food', 'fish food']}
    />
  );
};

export default OnlinePetStoreNYC;
