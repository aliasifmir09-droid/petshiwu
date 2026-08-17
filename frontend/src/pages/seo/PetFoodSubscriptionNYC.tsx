import SEOLandingPage from '../SEOLandingPage';

/**
 * Targets: "pet food subscription NYC", "auto-ship pet food New York", "recurring pet food delivery NYC"
 * Captures people looking for auto-ship alternatives
 */
const PetFoodSubscriptionNYC = () => {
  return (
    <SEOLandingPage
      keyword="pet-food-subscription-nyc"
      title="Pet Food in NYC Without Autoship — Same-Day Delivery | Petshiwu"
      description="No pet food subscription trap in NYC. Order when you want. Same-day if you order by 3 PM weekdays (1 PM weekends). No autoship. Free over $49."
      h1="NYC Pet Food Delivery — No Subscription Required"
      introContent="You do not need autoship to get pet food in NYC. Order when you want. Same-day if you order by 3 PM weekdays (1 PM weekends) — at the door before 11 PM. Reorder in a few clicks. No membership fee. Free over $49."
      problemPoints={[
        "Forgetting to reorder and running out of pet food at the worst time",
        "Subscriptions that lock you in or are hard to cancel",
        "Paying membership fees just to get reasonable delivery prices",
        "Auto-ship programs that send the wrong size or formula",
        "Being stuck with a subscription when your pet's diet changes"
      ]}
      solutionPoints={[
        "Easy reorder from your account — one click to repeat a past order",
        "No subscription required — order when you need it",
        "No membership fee — free delivery is just part of the deal on $49+ orders",
        "Change your order any time — no commitment",
        "Order reminders available so you never get caught off guard",
        "Delivering to all 5 NYC boroughs"
      ]}
      faqItems={[
        {
          question: "Do you offer a subscription service for pet food in NYC?",
          answer: "We make it easy to reorder from your account without requiring a subscription. No commitment, no locked-in pricing, no fees to cancel. Just reorder whenever you need to from your order history."
        },
        {
          question: "How do I make sure I never run out of pet food?",
          answer: "Create an account at Petshiwu.com, and your order history is always saved. When you're running low, log in and reorder your pet's food in seconds. You can also set a reminder in your calendar for when to reorder based on how fast your pet goes through food."
        },
        {
          question: "Are auto-delivery services worth it for NYC pet owners?",
          answer: "The appeal is never running out — but many subscription services lock you in or charge fees. At Petshiwu you get the convenience of easy reordering without the commitment. Order when you want, as much as you want."
        },
        {
          question: "What if my pet's diet changes?",
          answer: "No problem — since there's no subscription, you can order a completely different food next time. No cancellation process, no fees, no hassle. Your pet's needs change and your orders can too."
        },
        {
          question: "Is free delivery available for regular orders over $49?",
          answer: "Yes, every single time. Free delivery on every order over $49 — no membership, no limited-time promo, no games. Stock up on food and it ships free."
        }
      ]}
      searchTerms={['dog food', 'cat food', 'pet food', 'pet supplies', 'auto ship', 'repeat delivery', 'recurring order']}
    />
  );
};

export default PetFoodSubscriptionNYC;
