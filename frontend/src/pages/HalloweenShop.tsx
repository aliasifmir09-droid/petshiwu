import SEOLandingPage from './SEOLandingPage';

/**
 * The Petshiwu Halloween Shop — a seasonal collection page (like Chewy's and
 * PetSmart's holiday shops). Every product on it carries the 'halloween' tag;
 * the grid fills live from the products API, in-stock only.
 */
const HalloweenShop = () => {
  return (
    <SEOLandingPage
      keyword="halloween"
      title="Dog Halloween Costumes & Treats — The Halloween Shop | Petshiwu"
      description="Shop 45+ Halloween picks for dogs: costumes, dresses, tees, bandanas, spooky toys and Halloween treats. Ships nationwide in 2-5 business days, free over $49. Same-day in NYC on local stock."
      h1="The Petshiwu Halloween Shop"
      introContent="Halloween is better with a pet in costume. The Halloween Shop brings together the season's best in one place — costumes, dresses, and tees from Bark Fifth Avenue and Casual Canine, spooky toys, and Halloween treats from Blue Buffalo and Milk-Bone. Order today: everything ships nationwide in 2-5 business days, free over $49, and NYC customers get same-day delivery on locally stocked items."
      problemPoints={[
        "Costume shops sell out weeks before Halloween",
        "Big-box stores stock costumes only in a few sizes",
        "Halloween treats for pets disappear from shelves in October",
        "Hard to find costumes that actually fit small or large dogs"
      ]}
      solutionPoints={[
        "45+ Halloween picks in one collection — costumes, tees, toys and treats",
        "Sizes from XS to XXL, with per-item size charts on every product page",
        "Halloween treats from Blue Buffalo, True Chews and Milk-Bone",
        "Ships nationwide in 2-5 business days — free over $49",
        "Same-day delivery in NYC on locally stocked items",
        "Order early — the best sizes go first"
      ]}
      faqItems={[
        {
          question: "When should I order my dog's Halloween costume?",
          answer: "Order at least two weeks before Halloween. Costumes sell through quickly in October, and popular sizes go first. Ordering early means it arrives with time to spare — nationwide delivery takes 2-5 business days."
        },
        {
          question: "How do I pick the right costume size?",
          answer: "Every product page has a size chart with chest and length measurements. When in doubt, size up — most of our costumes use adjustable velcro or stretch fabric for a comfortable fit."
        },
        {
          question: "Do you have Halloween treats for dogs too?",
          answer: "Yes — the Halloween Shop includes Blue Buffalo Boo Bars and Boo Bits, True Chews Halloween jerky, and Milk-Bone graveyard and spooky biscuit tins. All dog-safe, all in stock."
        },
        {
          question: "Is same-day delivery available for Halloween items?",
          answer: "In NYC, yes — on locally stocked items ordered before the cutoff. Shipped items arrive nationwide in 2-5 business days. Each product page shows its honest delivery window."
        },
        {
          question: "Are pet costumes safe for all dogs?",
          answer: "Most dogs are comfortable in a light tee or dress for a few hours. Introduce the costume before the big night, watch for signs of stress, and never leave a costumed pet unattended. When a costume isn't their thing, a Halloween bandana or a spooky toy works just as well."
        }
      ]}
      searchTerms={['dog halloween costumes', 'halloween dog treats', 'pet costumes', 'dog costume', 'halloween pet toys', 'spooky dog toys']}
      productTags="halloween"
    />
  );
};

export default HalloweenShop;
