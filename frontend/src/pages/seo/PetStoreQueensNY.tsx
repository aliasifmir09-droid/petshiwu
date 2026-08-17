import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet store Queens NY", "pet supplies Queens New York", "pet shop Jackson Heights"
 * Answer those searches with delivery — we are not a walk-in shop.
 */
const PetStoreQueensNY = () => {
  return (
    <SEOLandingPage
      keyword="pet-store-queens-ny"
      title="Pet Store Queens NY — Same-Day Delivery, Not a Walk-In | Petshiwu"
      description="Queens pet delivery from Jackson Heights warehouse. Not a walk-in store. Order by 3 PM weekdays (1 PM weekends), before 11 PM. No autoship. Free over $49."
      h1="Queens Pet Delivery — We Bring It to Your Door Tonight"
      introContent="Petshiwu is Queens delivery, not a walk-in shop. Jackson Heights is office and warehouse only. Order by 3 PM weekdays (1 PM weekends) and we deliver before 11 PM to Flushing, Astoria, Forest Hills, Jamaica, and all of Queens. No autoship. Free over $49."
      problemPoints={[
        "No time to visit a pet store in Queens",
        "Having to travel to a big-box store for specialty items",
        "Out-of-stock on your pet's preferred brand or formula",
        "No local store carrying supplies for birds, reptiles, or exotic pets",
        "Carrying heavy supplies on the subway or bus"
      ]}
      solutionPoints={[
        "Delivery from our Jackson Heights warehouse — not a walk-in store",
        "Delivery throughout all Queens neighborhoods",
        "10,000+ products for every type of pet",
        "All the top national brands at competitive prices",
        "Free delivery on orders over $49 — no membership required",
        "Multilingual customer support for Queens' diverse communities"
      ]}
      faqItems={[
        {
          question: "Can I visit your pet store in Jackson Heights?",
          answer: "No. Petshiwu is delivery only. Our Jackson Heights location is office and warehouse — not a retail shop. Order online and we deliver to your door."
        },
        {
          question: "Do you deliver pet supplies to Jackson Heights, Queens?",
          answer: "Yes — we warehouse in Jackson Heights and deliver throughout the neighborhood and all of Queens. Order before the daily cutoff for fast local delivery."
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
