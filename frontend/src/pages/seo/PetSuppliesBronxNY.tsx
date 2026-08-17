import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet supplies Bronx NY", "pet store Bronx", "pet food delivery Bronx NYC"
 */
const PetSuppliesBronxNY = () => (
  <SEOLandingPage
    keyword="pet-supplies-bronx-ny"
    title="Same-Day Pet Supplies Bronx — Order by 3 PM | Petshiwu"
    description="Same-day pet delivery in the Bronx. Order by 3 PM weekdays (1 PM weekends), before 11 PM. Fordham, Riverdale, Mott Haven. No autoship. Free over $49."
    h1="Same-Day Pet Supplies Across the Bronx, NY"
    introContent="Petshiwu delivers pet food and supplies tonight across the Bronx — Riverdale, Fordham, Mott Haven, Hunts Point, Pelham Bay. Order by 3 PM weekdays (1 PM weekends) for delivery before 11 PM. No autoship. No car needed. Free over $49."
    problemPoints={[
      "Limited pet store options in many Bronx neighborhoods",
      "Having to travel far for quality pet food brands",
      "Local stores often out of stock on specific formulas",
      "Heavy bags on public transit",
      "Specialty diets for dogs and cats hard to find"
    ]}
    solutionPoints={[
      "Delivery to all Bronx neighborhoods — Fordham, Riverdale, Mott Haven, Hunts Point, Pelham Bay, Soundview, Morris Heights, and more",
      "10,000+ products including specialty and senior pet food",
      "Top brands: Purina, Blue Buffalo, Royal Canin, Hill's Science Diet",
      "Free delivery on orders $49+ — no membership required",
      "Same reliable quality as any Manhattan pet boutique",
      "Customer support in multiple languages"
    ]}
    faqItems={[
      {
        question: "Do you deliver pet supplies to the Bronx?",
        answer: "Yes! Petshiwu delivers to all Bronx neighborhoods including Fordham, Riverdale, Kingsbridge, Mott Haven, Hunts Point, Pelham Bay, Soundview, Morris Heights, Tremont, Throgs Neck, City Island, and more."
      },
      {
        question: "How much is delivery for pet supplies in the Bronx?",
        answer: "Delivery is $6 for orders under $49, and completely free for orders $49 and above. A bag of dog food or cat food alone usually qualifies for free delivery."
      },
      {
        question: "What dog food brands do you deliver to the Bronx?",
        answer: "We carry all major brands including Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet, Iams, Pedigree, Wellness, Nutro, and many more. Over 1,000 dog food options available."
      },
      {
        question: "Can I get cat litter delivered to the Bronx?",
        answer: "Yes — we stock dozens of cat litter options including clumping, non-clumping, silica crystal, natural/eco-friendly, and scented varieties from brands like Fresh Step, Arm & Hammer, and Tidy Cats. All delivered to your door."
      },
      {
        question: "Do you deliver to Riverdale and Fordham in the Bronx?",
        answer: "Yes — Riverdale, Fordham, and all Bronx ZIPs. Order by 3 PM weekdays (1 PM weekends) for delivery before 11 PM. No autoship."
      }
    ]}
    searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'cat litter', 'dog treats', 'bird food']}
  />
);

export default PetSuppliesBronxNY;
