/**
 * publishMissingNeighborhoods.mjs
 * Covers missing Queens neighborhoods + all Brooklyn neighborhoods we haven't hit
 */
const API_BASE = 'https://petshiwu.onrender.com';
async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:'admin@petshiwu.com',password:'@Admin,1+23as'}) });
  return (await res.json()).token;
}
async function pub(token, post) {
  const res = await fetch(`${API_BASE}/api/v1/blogs/admin`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({...post,isPublished:true,publishedAt:new Date().toISOString()}) });
  const d = await res.json();
  const ok = d.success||d._id||d.data?._id;
  process.stdout.write(`${ok?'✅':'❌'} ${post.title.substring(0,72)}\n`);
  return ok;
}

function makeNeighborhoodPost(name, borough, slug, zip, desc, nearbyLandmarks, img) {
  return {
    title: `Pet Food Delivery in ${name}, ${borough} NY — PetShiwu`,
    slug,
    petType:'all', category:'Pet Care Tips',
    tags:[`pet food ${name}`,`pet store ${name} ${borough}`,`dog food ${name} NY`,`cat food ${name} Brooklyn`,`pet delivery ${name} NYC`],
    featuredImage:`https://images.unsplash.com/${img}?w=1200&q=80`,
    metaTitle:`Pet Food Delivery ${name} ${borough} NY — Free Shipping Over $49 | PetShiwu`,
    metaDescription:`Pet food and supplies delivered to ${name}, ${borough}. Purina, Blue Buffalo, Royal Canin and 10,000+ products. Free shipping over $49.`,
    excerpt:`Get premium pet food delivered to ${name}, ${borough}. PetShiwu ships 10,000+ products — dog food, cat food, litter, toys — to every ${borough} neighborhood.`,
    content:`<h2>Pet Food and Supplies Delivered to ${name}, ${borough}</h2>
<p>${desc} PetShiwu delivers 10,000+ premium pet products directly to your ${name} door — no subway trips, no heavy bags, no driving.</p>
<h2>What We Deliver to ${name}</h2>
<ul>
<li><a href="https://www.petshiwu.com/dog/dog-food">Dog food</a>: Purina Pro Plan, Blue Buffalo, Royal Canin, Hill's Science Diet, Merrick, Orijen</li>
<li><a href="https://www.petshiwu.com/cat/cat-food">Cat food</a>: Fancy Feast, Sheba, Purina ONE, Royal Canin, Hill's Science Diet</li>
<li><a href="https://www.petshiwu.com/cat/cat-litter">Cat litter</a>: Dr. Elsey's, Fresh Step, Tidy Cats</li>
<li><a href="https://www.petshiwu.com/dog/dog-treats">Treats</a>: Greenies, Milk-Bone, Zesty Paws, Blue Buffalo</li>
<li><a href="https://www.petshiwu.com/dog/dog-toys">Toys</a>: Kong, Nylabone, and 500+ options</li>
<li><a href="https://www.petshiwu.com/bird">Bird</a>, <a href="https://www.petshiwu.com/reptile">reptile</a>, <a href="https://www.petshiwu.com/small-pet">small animal</a>, <a href="https://www.petshiwu.com/fish">fish supplies</a></li>
</ul>
<h2>Serving ${name} — Zip Code${zip.includes(',') ? 's' : ''} ${zip}</h2>
<p>${nearbyLandmarks}</p>
<h2>Free Shipping Over $49</h2>
<p>Orders ship in 1 business day and arrive in 2–5 business days. Subscribe for auto-shipments and save 10% on every order.</p>
<p><a href="https://www.petshiwu.com/products">Shop all products and get delivered to ${name} →</a></p>`
  };
}

const neighborhoods = [
  // MISSING QUEENS
  makeNeighborhoodPost('Ridgewood','Queens','pet-food-delivery-ridgewood-queens-ny','11385',
    'Ridgewood sits at the border of Queens and Brooklyn — a neighborhood of beautiful pre-war rowhouses and a growing community of young families and pet owners.',
    'We deliver to all Ridgewood streets including Myrtle Ave, Forest Ave, Fresh Pond Road, and into the Seneca Ave area.',
    'photo-1450778869180-41d0601e046e'),
  makeNeighborhoodPost('Maspeth','Queens','pet-food-delivery-maspeth-queens-ny','11378',
    'Maspeth is a tight-knit Queens neighborhood with a strong community feel and many multi-pet households.',
    'Delivering to all Maspeth zip code 11378 — Grand Ave corridor and surrounding residential streets.',
    'photo-1548199973-03cce0bbc87b'),
  makeNeighborhoodPost('Middle Village','Queens','pet-food-delivery-middle-village-queens-ny','11379',
    'Middle Village is a quiet, suburban-feeling neighborhood in central Queens known for Juniper Valley Park — a great spot for dog owners.',
    'Serving all of Middle Village including Juniper Valley Park area, Metropolitan Ave, and 69th Street.',
    'photo-1587300003388-59208cc962cb'),
  makeNeighborhoodPost('Glendale','Queens','pet-food-delivery-glendale-queens-ny','11385',
    'Glendale borders Ridgewood and Middle Village — a neighborhood of working families with plenty of dog-friendly parks nearby.',
    'Delivering to zip code 11385 Glendale area including Woodhaven Blvd and Cooper Ave corridors.',
    'photo-1543466835-00a7907e9de1'),
  makeNeighborhoodPost('Richmond Hill','Queens','pet-food-delivery-richmond-hill-queens-ny','11418',
    'Richmond Hill is a diverse Queens neighborhood with a strong South Asian and Caribbean community, home to many pet-owning families.',
    'Serving all Richmond Hill zip codes: 11418, 11419, 11421 — Liberty Ave, Lefferts Blvd, Jamaica Ave.',
    'photo-1450778869180-41d0601e046e'),
  makeNeighborhoodPost('Howard Beach','Queens','pet-food-delivery-howard-beach-queens-ny','11414',
    'Howard Beach is a waterfront Queens neighborhood known for its tight-knit community and proximity to Jamaica Bay Wildlife Refuge — perfect for dog walks.',
    'Delivering to all Howard Beach zip code 11414 — Cross Bay Blvd, 165th Ave, and surrounding streets.',
    'photo-1548199973-03cce0bbc87b'),
  makeNeighborhoodPost('Ozone Park','Queens','pet-food-delivery-ozone-park-queens-ny','11416',
    'Ozone Park is a diverse, family-oriented Queens neighborhood where many residents keep multiple pets across apartments and small homes.',
    'Serving zip codes 11416 and 11417 — Rockaway Blvd, 101st Ave, and Linden Blvd corridors.',
    'photo-1587300003388-59208cc962cb'),
  makeNeighborhoodPost('Kew Gardens','Queens','pet-food-delivery-kew-gardens-queens-ny','11415',
    'Kew Gardens is an upscale Queens neighborhood known for its Tudor-style homes, Maple Grove Cemetery, and the Forest Park greenway — excellent for dog walking.',
    'Delivering to all Kew Gardens zip code 11415 — Lefferts Blvd, Austin St, and Park Lane South.',
    'photo-1543466835-00a7907e9de1'),
  makeNeighborhoodPost('Springfield Gardens','Queens','pet-food-delivery-springfield-gardens-queens-ny','11413',
    'Springfield Gardens is a residential southeastern Queens neighborhood with many single-family homes and a large community of pet-owning families.',
    'Serving zip code 11413 — Springfield Blvd, Merrick Blvd, and Baisley Blvd corridors.',
    'photo-1450778869180-41d0601e046e'),
  // BROOKLYN - additional neighborhoods
  makeNeighborhoodPost('Bay Ridge','Brooklyn','pet-food-delivery-bay-ridge-brooklyn-ny','11209',
    'Bay Ridge is a charming southwest Brooklyn neighborhood with wide streets, stunning views of the Verrazzano Bridge, and a strong community of dog owners who frequent Shore Road Park.',
    'Serving all Bay Ridge including Shore Road, 3rd Ave, and the 95th Street area near the bridge.',
    'photo-1548199973-03cce0bbc87b'),
  makeNeighborhoodPost('Bushwick','Brooklyn','pet-food-delivery-bushwick-brooklyn-ny','11206',
    'Bushwick is one of Brooklyn\'s fastest-growing neighborhoods — artists, young professionals, and many pet-owning renters fill the converted warehouse apartments and brownstones.',
    'Delivering to all Bushwick zip codes: 11206, 11207, 11221 — Myrtle Ave, Knickerbocker Ave, Jefferson Ave.',
    'photo-1587300003388-59208cc962cb'),
  makeNeighborhoodPost('Crown Heights','Brooklyn','pet-food-delivery-crown-heights-brooklyn-ny','11213',
    'Crown Heights is a vibrant Brooklyn neighborhood with Prospect Park nearby — one of NYC\'s best off-leash dog areas — and a growing population of young pet-owning families.',
    'Serving zip codes 11213 and 11238 — Eastern Parkway, Kingston Ave, and Nostrand Ave.',
    'photo-1543466835-00a7907e9de1'),
  makeNeighborhoodPost('Flatbush','Brooklyn','pet-food-delivery-flatbush-brooklyn-ny','11226',
    'Flatbush is a large, diverse Brooklyn neighborhood with a strong Caribbean community and many multi-pet households across its residential streets.',
    'Delivering to all Flatbush zip codes: 11226, 11210 — Flatbush Ave, Church Ave, Nostrand Ave.',
    'photo-1450778869180-41d0601e046e'),
  makeNeighborhoodPost('Brownsville','Brooklyn','pet-food-delivery-brownsville-brooklyn-ny','11212',
    'Brownsville is a Brooklyn neighborhood with deep community roots and a population of dedicated pet owners who deserve premium pet food at fair prices.',
    'Serving all Brownsville zip code 11212 — Pitkin Ave, Livonia Ave, and Rockaway Ave.',
    'photo-1548199973-03cce0bbc87b'),
  makeNeighborhoodPost('East Flatbush','Brooklyn','pet-food-delivery-east-flatbush-brooklyn-ny','11203',
    'East Flatbush is a predominantly Caribbean-American Brooklyn neighborhood with strong community bonds and many multi-pet families.',
    'Delivering to zip code 11203 — Nostrand Ave, New York Ave, and Church Ave.',
    'photo-1587300003388-59208cc962cb'),
];

async function main() {
  const token = await login();
  console.log(`Publishing ${neighborhoods.length} neighborhood posts...\n`);
  let ok=0,fail=0;
  for (const n of neighborhoods) {
    const success = await pub(token, n);
    success?ok++:fail++;
    await new Promise(r=>setTimeout(r,350));
  }
  console.log(`\nPublished: ${ok} | Failed: ${fail}`);
}
main();
