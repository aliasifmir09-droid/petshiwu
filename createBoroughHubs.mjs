import { MongoClient, ObjectId } from '/workspace/petshiwu/node_modules/mongodb/lib/index.js';

const uri = process.env.MONGO_URI;
const AUTHOR_ID = new ObjectId('69389a8553df9b1f9b03a2ba');
const NOW = new Date();

const hubs = [
  {
    slug: 'pet-food-delivery-queens-ny-petshiwu',
    title: 'Pet Food & Supplies Delivery in Queens, NY — PetShiwu',
    metaTitle: 'Pet Food Delivery Queens NY | Free Shipping Over $49 | PetShiwu',
    metaDescription: 'Order pet food and supplies online with fast delivery to every Queens neighborhood — Jackson Heights, Flushing, Astoria, Jamaica, Forest Hills and more. Free shipping on orders over $49.',
    petType: 'all',
    category: 'Pet Care Tips',
    tags: ['pet food delivery Queens', 'pet supplies Queens NY', 'dog food Queens', 'cat food Queens', 'Jackson Heights pet store', 'Flushing pet delivery', 'Astoria pet supplies', 'online pet store Queens'],
    excerpt: 'Order pet food and supplies online with fast delivery to every Queens neighborhood. Free shipping on orders over $49.',
    content: `<h1>Pet Food &amp; Supplies Delivery in Queens, NY</h1>

<p>Queens pet owners deserve the same access to premium pet nutrition that anyone else in the country gets — and PetShiwu delivers exactly that, straight to your door. Whether you're in Jackson Heights, Flushing, Astoria, Jamaica, Forest Hills, or any of the dozens of neighborhoods that make up the most ethnically diverse borough in the world, we bring 10,000+ pet products from top brands right to your building.</p>

<p>We know Queens. We started here. Our service area covers every zip code in the borough, and we ship free on every order over $49. No membership. No subscription required. Just pick what your pet needs and we'll handle the rest.</p>

<h2>Neighborhoods We Serve in Queens</h2>
<p>PetShiwu delivers pet food and supplies to every neighborhood across Queens, including:</p>
<ul>
  <li><strong>Jackson Heights</strong> — our home neighborhood</li>
  <li><strong>Flushing</strong> — including Murray Hill and Kissena Park</li>
  <li><strong>Astoria &amp; Long Island City</strong></li>
  <li><strong>Forest Hills &amp; Rego Park</strong></li>
  <li><strong>Jamaica &amp; Springfield Gardens</strong></li>
  <li><strong>Elmhurst &amp; Corona</strong></li>
  <li><strong>Sunnyside &amp; Woodside</strong></li>
  <li><strong>Bayside &amp; Whitestone &amp; Fresh Meadows</strong></li>
  <li><strong>Howard Beach &amp; Ozone Park &amp; Richmond Hill</strong></li>
  <li><strong>Ridgewood &amp; Glendale &amp; Maspeth &amp; Middle Village</strong></li>
  <li><strong>Kew Gardens &amp; Kew Gardens Hills</strong></li>
</ul>

<h2>What We Deliver</h2>
<ul>
  <li><strong>Dog food</strong> — dry kibble, wet food, raw and freeze-dried, grain-free, breed-specific formulas</li>
  <li><strong>Cat food</strong> — pâté, shredded, air-dried, indoor formulas, hairball control</li>
  <li><strong>Small pet supplies</strong> — food and bedding for rabbits, guinea pigs, hamsters, and birds</li>
  <li><strong>Fish &amp; aquarium supplies</strong> — food, water conditioners, décor, filters</li>
  <li><strong>Treats &amp; chews</strong> — training treats, dental chews, natural bones</li>
  <li><strong>Litter &amp; cleanup</strong> — clumping, crystal, natural, and disposable options</li>
  <li><strong>Health &amp; wellness</strong> — supplements, flea &amp; tick, vitamins, dental care</li>
</ul>

<h2>How Delivery Works</h2>
<ol>
  <li>Browse 10,000+ products at petshiwu.com</li>
  <li>Add to cart — no account required to shop</li>
  <li>Checkout: shipping is <strong>$6 for orders under $49</strong>, <strong>FREE for orders $49 and over</strong></li>
  <li>Your order ships directly to your Queens address</li>
</ol>

<h2>Top Brands Available in Queens</h2>
<p>We carry the brands Queens pet owners trust most — Hill's Science Diet, Royal Canin, Purina Pro Plan, Blue Buffalo, Wellness, Orijen, Acana, Taste of the Wild, Fancy Feast, Iams, Merrick, and hundreds more.</p>

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Do you deliver to all of Queens?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Yes. PetShiwu delivers to every neighborhood and zip code in Queens, NY — from Astoria to Springfield Gardens, from Whitestone to Howard Beach.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">How much does delivery cost in Queens?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Shipping is $6 flat for orders under $49. Orders $49 and over ship completely free — no minimum orders, no membership required.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Do I need a membership to order from PetShiwu?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">No membership required. Shop, checkout, and get your order delivered. Creating a free account just makes reordering faster.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">What if my building has no doorman?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">You can add delivery instructions at checkout — leave at door, ring buzzer, leave with neighbor, or any specific note for your building.</p>
    </div>
  </div>
</div>

<h2>Why Queens Pet Owners Choose PetShiwu</h2>
<p>Queens is home to over 2 million people and hundreds of thousands of pets. We built PetShiwu specifically to serve NYC pet owners better — with a wider selection than any local store, prices that compete with the big national retailers, and delivery that actually works for apartment dwellers and busy families.</p>
<p>Shop at <a href="https://www.petshiwu.com">petshiwu.com</a> and get everything your pet needs delivered to your Queens address.</p>`
  },
  {
    slug: 'pet-food-delivery-brooklyn-ny-petshiwu',
    title: 'Pet Food & Supplies Delivery in Brooklyn, NY — PetShiwu',
    metaTitle: 'Pet Food Delivery Brooklyn NY | Free Shipping Over $49 | PetShiwu',
    metaDescription: 'Order pet food and supplies online with fast delivery to all Brooklyn neighborhoods — Williamsburg, Park Slope, Flatbush, Bay Ridge, Bed-Stuy, Crown Heights and more. Free shipping on orders over $49.',
    petType: 'all',
    category: 'Pet Care Tips',
    tags: ['pet food delivery Brooklyn', 'pet supplies Brooklyn NY', 'dog food Brooklyn', 'cat food Brooklyn', 'Williamsburg pet store', 'Park Slope pet delivery', 'Flatbush pet supplies', 'online pet store Brooklyn'],
    excerpt: 'Order pet food and supplies online with fast delivery to all Brooklyn neighborhoods. Free shipping on orders over $49.',
    content: `<h1>Pet Food &amp; Supplies Delivery in Brooklyn, NY</h1>

<p>Brooklyn is the most populated borough in New York City — and home to some of the most devoted pet owners in the country. PetShiwu delivers 10,000+ pet food and supply products to every Brooklyn neighborhood, from Williamsburg to Bay Ridge, from Greenpoint to Brownsville. No membership, no subscription — just the brands your pet loves, shipped straight to your door.</p>

<p>Free delivery on every order over $49. Flat $6 shipping for smaller orders. Brooklyn pet owners have been waiting for a better option than hauling 30-pound kibble bags home on the subway — we built that option.</p>

<h2>Neighborhoods We Serve in Brooklyn</h2>
<ul>
  <li><strong>Williamsburg &amp; Greenpoint</strong></li>
  <li><strong>Park Slope &amp; Prospect Heights</strong></li>
  <li><strong>Crown Heights &amp; Flatbush &amp; East Flatbush</strong></li>
  <li><strong>Bed-Stuy (Bedford-Stuyvesant)</strong></li>
  <li><strong>Bay Ridge &amp; Sunset Park &amp; Borough Park</strong></li>
  <li><strong>Bensonhurst &amp; Sheepshead Bay</strong></li>
  <li><strong>Brooklyn Heights &amp; DUMBO &amp; Cobble Hill</strong></li>
  <li><strong>Bushwick &amp; Brownsville</strong></li>
  <li><strong>Carroll Gardens &amp; Gowanus &amp; Red Hook</strong></li>
  <li><strong>Ditmas Park &amp; Kensington &amp; Windsor Terrace</strong></li>
  <li><strong>Marine Park &amp; Mill Basin &amp; Bergen Beach</strong></li>
</ul>

<h2>What We Deliver</h2>
<ul>
  <li><strong>Dog food</strong> — dry kibble, wet food, raw and freeze-dried, breed-specific formulas</li>
  <li><strong>Cat food</strong> — pâté, shredded, air-dried, indoor and outdoor formulas</li>
  <li><strong>Small pet supplies</strong> — rabbit, guinea pig, hamster, bird food and bedding</li>
  <li><strong>Fish &amp; aquarium supplies</strong></li>
  <li><strong>Treats &amp; chews, litter &amp; cleanup, health &amp; wellness</strong></li>
</ul>

<h2>How Delivery Works</h2>
<ol>
  <li>Browse 10,000+ products at petshiwu.com</li>
  <li>Add to cart — no account required</li>
  <li>Shipping: <strong>$6 flat for orders under $49</strong>, <strong>FREE for orders $49 and over</strong></li>
  <li>Your order ships to your Brooklyn address</li>
</ol>

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Do you deliver to all Brooklyn neighborhoods?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Yes — PetShiwu delivers to every neighborhood and zip code in Brooklyn, from Greenpoint and Williamsburg in the north to Sheepshead Bay and Bay Ridge in the south.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">How much is shipping to Brooklyn?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Shipping to Brooklyn is $6 for orders under $49. Orders totaling $49 or more ship free. No membership needed.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Can you deliver to Brooklyn apartments?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Absolutely. Add delivery instructions at checkout for your specific building — ring buzzer, leave at door, leave with super, or any custom note.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">What pet food brands do you carry for Brooklyn delivery?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">We carry 10,000+ products from over 100 brands including Hill's Science Diet, Royal Canin, Purina Pro Plan, Blue Buffalo, Wellness, Orijen, Acana, and many more.</p>
    </div>
  </div>
</div>

<h2>Brooklyn's Best Online Pet Store</h2>
<p>Brooklyn pet owners shouldn't have to lug heavy bags home on the G train or overpay at the corner pet shop. PetShiwu gives you access to a full national-scale catalog at competitive prices, delivered to your door. Visit <a href="https://www.petshiwu.com">petshiwu.com</a> and place your first order today.</p>`
  },
  {
    slug: 'pet-food-delivery-manhattan-ny-petshiwu',
    title: 'Pet Food & Supplies Delivery in Manhattan, NY — PetShiwu',
    metaTitle: 'Pet Food Delivery Manhattan NY | Free Shipping Over $49 | PetShiwu',
    metaDescription: 'Premium pet food and supplies delivered to all Manhattan neighborhoods — Upper West Side, Upper East Side, Harlem, Chelsea, Lower East Side, Washington Heights. Free shipping on orders over $49.',
    petType: 'all',
    category: 'Pet Care Tips',
    tags: ['pet food delivery Manhattan', 'pet supplies Manhattan NY', 'dog food Manhattan', 'cat food Manhattan', 'Upper West Side pet store', 'Harlem pet delivery', 'Chelsea pet supplies', 'online pet store Manhattan NYC'],
    excerpt: 'Premium pet food and supplies delivered to all Manhattan neighborhoods. Free shipping on orders over $49.',
    content: `<h1>Pet Food &amp; Supplies Delivery in Manhattan, NY</h1>

<p>Manhattan apartments are small. Storage is limited. Carrying heavy bags of pet food through crowded streets, up stairs, and into elevators is nobody's idea of a good time. PetShiwu solves that: 10,000+ pet food and supply products from top brands, delivered directly to your Manhattan address with free shipping on orders over $49.</p>

<p>We serve every Manhattan neighborhood from Inwood in the north to the Financial District in the south. Urban apartment living and premium pet care aren't in conflict — you just need the right delivery partner.</p>

<h2>Neighborhoods We Serve in Manhattan</h2>
<ul>
  <li><strong>Upper West Side &amp; Upper East Side</strong></li>
  <li><strong>Harlem, East Harlem &amp; Hamilton Heights</strong></li>
  <li><strong>Washington Heights &amp; Inwood</strong></li>
  <li><strong>Midtown &amp; Hell's Kitchen (Clinton)</strong></li>
  <li><strong>Chelsea &amp; Flatiron &amp; Gramercy</strong></li>
  <li><strong>Lower East Side &amp; East Village &amp; Greenwich Village</strong></li>
  <li><strong>SoHo &amp; Tribeca &amp; Financial District</strong></li>
  <li><strong>Morningside Heights &amp; Manhattanville</strong></li>
  <li><strong>Murray Hill &amp; Kips Bay &amp; Turtle Bay</strong></li>
  <li><strong>Battery Park City &amp; Two Bridges</strong></li>
</ul>

<h2>What We Deliver</h2>
<ul>
  <li><strong>Dog food</strong> — dry kibble, wet food, raw and freeze-dried, grain-free options</li>
  <li><strong>Cat food</strong> — pâté, shredded, air-dried, weight management, indoor formulas</li>
  <li><strong>Small pet supplies</strong> — rabbit, guinea pig, bird, hamster food and accessories</li>
  <li><strong>Treats, litter (including lightweight options for apartments), health &amp; wellness</strong></li>
</ul>

<h2>How Delivery Works</h2>
<ol>
  <li>Browse 10,000+ products at petshiwu.com</li>
  <li>Shipping: <strong>$6 flat for orders under $49</strong>, <strong>FREE for orders $49 and over</strong></li>
  <li>Add apartment/building delivery instructions at checkout</li>
  <li>Order ships to your Manhattan address</li>
</ol>

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Do you deliver to Manhattan apartments?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Yes. We deliver to Manhattan apartments, condos, co-ops, and townhouses. Add building-specific instructions at checkout — doorman building, buzzer code, leave at door, or any custom note.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">How much is shipping to Manhattan?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">$6 flat for orders under $49. Free for orders of $49 or more. No membership, no subscription, no minimum order size.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Do you deliver to doorman buildings?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Yes. Specify doorman delivery at checkout. Your order will be left with the front desk if you're not home.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Is there a minimum order for Manhattan delivery?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">No minimum order. Shipping is $6 for orders under $49, and free above that threshold.</p>
    </div>
  </div>
</div>

<h2>Manhattan Pet Owners Deserve Better</h2>
<p>Premium pet nutrition, delivered to your Manhattan door. Visit <a href="https://www.petshiwu.com">petshiwu.com</a> to shop now.</p>`
  },
  {
    slug: 'pet-food-delivery-bronx-ny-petshiwu',
    title: 'Pet Food & Supplies Delivery in the Bronx, NY — PetShiwu',
    metaTitle: 'Pet Food Delivery Bronx NY | Free Shipping Over $49 | PetShiwu',
    metaDescription: 'Order pet food and supplies with fast delivery to the Bronx — Fordham, Riverdale, Pelham Bay, Morris Park, Tremont, Concourse and every neighborhood. Free shipping on orders over $49.',
    petType: 'all',
    category: 'Pet Care Tips',
    tags: ['pet food delivery Bronx', 'pet supplies Bronx NY', 'dog food Bronx', 'cat food Bronx', 'Fordham pet store', 'Riverdale pet delivery', 'online pet store Bronx NYC'],
    excerpt: 'Order pet food and supplies with fast delivery to every Bronx neighborhood. Free shipping on orders over $49.',
    content: `<h1>Pet Food &amp; Supplies Delivery in the Bronx, NY</h1>

<p>The Bronx is home to hundreds of thousands of pets — and PetShiwu delivers premium pet food and supplies to every corner of the borough. From Riverdale in the northwest to Pelham Bay in the east, from Fordham to Tremont, we bring 10,000+ products straight to your door. Free shipping on orders over $49.</p>

<h2>Neighborhoods We Serve in the Bronx</h2>
<ul>
  <li><strong>Fordham &amp; University Heights</strong></li>
  <li><strong>Riverdale &amp; Fieldston &amp; Spuyten Duyvil</strong></li>
  <li><strong>Pelham Bay &amp; Co-op City</strong></li>
  <li><strong>Morris Park &amp; Parkchester</strong></li>
  <li><strong>Tremont &amp; Belmont (Little Italy)</strong></li>
  <li><strong>Grand Concourse &amp; Highbridge</strong></li>
  <li><strong>Mott Haven &amp; Hunts Point</strong></li>
  <li><strong>Soundview &amp; Throggs Neck</strong></li>
  <li><strong>Norwood &amp; Woodlawn &amp; Wakefield</strong></li>
  <li><strong>Kingsbridge &amp; Bedford Park</strong></li>
</ul>

<h2>How Delivery Works</h2>
<ol>
  <li>Shop petshiwu.com — 10,000+ products, no account required</li>
  <li>Shipping: <strong>$6 for orders under $49</strong>, <strong>FREE for orders $49 and over</strong></li>
  <li>Add building delivery instructions at checkout</li>
</ol>

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Do you deliver to all Bronx neighborhoods?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Yes — PetShiwu delivers to every Bronx neighborhood and zip code, from Riverdale and Fordham to Pelham Bay and Co-op City.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">How much does delivery cost to the Bronx?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Shipping to the Bronx is $6 flat for orders under $49. Orders of $49 or more ship completely free.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">What brands do you carry?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Hill's Science Diet, Royal Canin, Purina Pro Plan, Blue Buffalo, Wellness, Orijen, Taste of the Wild, Fancy Feast, Iams, Merrick, and over 100 more brands — all available for Bronx delivery.</p>
    </div>
  </div>
</div>

<p>Give your Bronx pet the nutrition they deserve. Shop at <a href="https://www.petshiwu.com">petshiwu.com</a>.</p>`
  },
  {
    slug: 'pet-food-delivery-staten-island-ny-petshiwu',
    title: 'Pet Food & Supplies Delivery in Staten Island, NY — PetShiwu',
    metaTitle: 'Pet Food Delivery Staten Island NY | Free Shipping Over $49 | PetShiwu',
    metaDescription: 'Premium pet food and supplies delivered to Staten Island — St. George, Tottenville, New Dorp, Stapleton, and every neighborhood. Free shipping on orders over $49.',
    petType: 'all',
    category: 'Pet Care Tips',
    tags: ['pet food delivery Staten Island', 'pet supplies Staten Island NY', 'dog food Staten Island', 'cat food Staten Island', 'online pet store Staten Island NYC'],
    excerpt: 'Premium pet food and supplies delivered to every Staten Island neighborhood. Free shipping on orders over $49.',
    content: `<h1>Pet Food &amp; Supplies Delivery in Staten Island, NY</h1>

<p>Staten Island pet owners deserve convenient access to premium pet nutrition. PetShiwu delivers 10,000+ pet food and supply products to every Staten Island neighborhood — fast, reliable, with free shipping on orders over $49. Whether you're near the ferry in St. George or down in Tottenville, we bring the brands your pet loves straight to your door.</p>

<h2>Neighborhoods We Serve on Staten Island</h2>
<ul>
  <li><strong>St. George &amp; Tompkinsville &amp; Stapleton</strong></li>
  <li><strong>New Dorp &amp; Dongan Hills &amp; Great Kills</strong></li>
  <li><strong>Tottenville &amp; Charleston &amp; Pleasant Plains</strong></li>
  <li><strong>Westerleigh &amp; Castleton Corners &amp; Bulls Head</strong></li>
  <li><strong>Eltingville &amp; Annadale &amp; Huguenot</strong></li>
  <li><strong>Port Richmond &amp; Mariners Harbor</strong></li>
  <li><strong>Willowbrook &amp; Travis &amp; Heartland Village</strong></li>
</ul>

<h2>How Delivery Works</h2>
<ol>
  <li>Shop petshiwu.com — 10,000+ products</li>
  <li>Shipping: <strong>$6 for orders under $49</strong>, <strong>FREE for $49 and over</strong></li>
  <li>Enter delivery instructions for your home at checkout</li>
</ol>

<h2>Frequently Asked Questions</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Do you deliver to all of Staten Island?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Yes — PetShiwu delivers to every neighborhood and zip code on Staten Island, from St. George near the ferry to Tottenville at the southern tip.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">How much does delivery cost to Staten Island?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Shipping to Staten Island is $6 for orders under $49 and completely free for orders of $49 or more. No membership needed.</p>
    </div>
  </div>
</div>

<p>Shop at <a href="https://www.petshiwu.com">petshiwu.com</a> and get everything your Staten Island pet needs delivered to your door.</p>`
  }
];

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
await client.connect();
const db = client.db('petshop');
const col = db.collection('blogs');

for (const hub of hubs) {
  const existing = await col.findOne({ slug: hub.slug });
  if (existing) {
    console.log(`✓ Already exists: ${hub.slug}`);
    continue;
  }
  const result = await col.insertOne({
    ...hub,
    author: AUTHOR_ID,
    isPublished: true,
    publishedAt: NOW,
    views: 0,
    createdAt: NOW,
    updatedAt: NOW
  });
  console.log(`✅ Created: ${hub.slug} (${result.insertedId})`);
}

console.log('\nDone.');
await client.close();
