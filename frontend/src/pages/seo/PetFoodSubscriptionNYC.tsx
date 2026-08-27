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
      description="Pet food in NYC without a lock-in subscription. Ask first for 7% off (max $10), or Autoship so you never forget. Same-day if you order by 3 PM weekdays. Free over $49."
      h1="NYC Pet Food Delivery — Ask First or Autoship"
      introContent="You do not need a lock-in subscription to get pet food in NYC. Ask first: we email you, you confirm, 7% off (max $10). Autoship: we email you on a schedule so you never forget. Either way we never charge unless you pay. Same-day if you order by 3 PM weekdays. Free over $49."
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
        "Ask first emails so you confirm restock for 7% off (max $10) — or Autoship so you never forget",
        "Delivering to all 5 NYC boroughs"
      ]}
      faqItems={[
        {
          question: "Do you offer a subscription service for pet food in NYC?",
          answer: "Autoship is optional, never required. Ask first emails you every cycle — you confirm and pay, and get 7% off (max $10). Autoship emails you on the same schedule so you never forget. Ignore either email and we never charge."
        },
        {
          question: "How do I make sure I never run out of pet food?",
          answer: "Log in and pick Ask first or Autoship on your homepage dashboard. Ask first is the better deal for most people (7% off, max $10). Autoship is better if you never want to forget. You can also reorder from order history any time."
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
