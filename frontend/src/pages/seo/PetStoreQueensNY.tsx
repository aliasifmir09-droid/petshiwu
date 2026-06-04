import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet store Queens NY", "pet supplies Queens New York", "pet shop Jackson Heights"
 * High local intent, captures "near me" searches in Queens
 */
const PetStoreQueensNY = () => {
  return (
    <SEOLandingPage
      keyword="pet-store-queens-ny"
      title="Pet Store Queens NY — Delivery to Jackson Heights, Flushing & All of Queens | PetShiwu"
      description="Queens' premier online pet store. Free delivery throughout Queens — Jackson Heights, Flushing, Astoria, Forest Hills, Jamaica and more. 10,000+ products for dogs, cats, birds, fish and more."
      h1="Pet Store Serving All of Queens, NY"
      introContent="PetShiwu is Queens' own online pet store, based right in Jackson Heights. We deliver premium pet food, toys, and supplies throughout Queens — Jackson Heights, Flushing, Astoria, Forest Hills, Rego Park, Jamaica, Bayside, and every neighborhood in between. Shop 10,000+ products and get free delivery on orders over $49."
      problemPoints={[
        "Limited pet store options in many Queens neighborhoods",
        "Having to travel to a big-box store for specialty items",
        "Out-of-stock on your pet's preferred brand or formula",
        "No local store carrying supplies for birds, reptiles, or exotic pets",
        "Carrying heavy supplies on the subway or bus"
      ]}
      solutionPoints={[
        "Based in Jackson Heights — a true Queens pet store",
        "Delivery throughout all Queens neighborhoods",
        "10,000+ products for every type of pet",
        "All the top national brands at competitive prices",
        "Free delivery on orders over $49 — no membership required",
        "Multilingual customer support for Queens' diverse communities"
      ]}
      faqItems={[
        {
          question: "Do you deliver pet supplies to Jackson Heights, Queens?",
          answer: "Yes — we're based in Jackson Heights and deliver throughout the neighborhood and all of Queens. Order before the daily cutoff for fast local delivery."
        },
        {
          question: "What Queens neighborhoods do you deliver to?",
          answer: "We deliver to all Queens neighborhoods: Jackson Heights, Flushing, Astoria, Forest Hills, Rego Park, Jamaica, Bayside, Woodside, Elmhurst, Corona, Ridgewood, Glendale, Ozone Park, Howard Beach, Rockaway, and everywhere in between."
        },
        {
          question: "Do you carry halal or ethnic pet food brands?",
          answer: "We carry a diverse range of products that reflect Queens' multicultural community. Our selection includes international brands and specialty diets from around the world. If you're looking for something specific, use our search or contact us at support@petshiwu.com."
        },
        {
          question: "Is there a minimum order for delivery in Queens?",
          answer: "No minimum order required! Delivery is $6 for orders under $49, and completely free for orders $49 and above. Most orders of pet food or supplies easily reach the free delivery threshold."
        },
        {
          question: "Do you carry supplies for birds and exotic pets in Queens?",
          answer: "Absolutely. We stock food, cages, toys, and accessories for birds, fish, reptiles, and small pets like rabbits and guinea pigs. Queens has a huge community of bird and exotic pet owners and we're stocked to serve them."
        }
      ]}
      searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'bird food', 'pet toys', 'dog treats']}
    />
  );
};

export default PetStoreQueensNY;
