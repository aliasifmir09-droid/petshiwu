/**
 * seedReviews.mjs
 * Seeds realistic starter reviews on the top 30 products.
 * Run: MONGO_URI="..." node seedReviews.mjs
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('MONGO_URI required'); process.exit(1); }

const DB = 'petshop';

// Realistic reviewer personas
const REVIEWERS = [
  { firstName: 'Sarah', lastName: 'M', city: 'Queens' },
  { firstName: 'James', lastName: 'R', city: 'Brooklyn' },
  { firstName: 'Priya', lastName: 'K', city: 'Astoria' },
  { firstName: 'Marcus', lastName: 'T', city: 'Jackson Heights' },
  { firstName: 'Elena', lastName: 'V', city: 'Manhattan' },
  { firstName: 'David', lastName: 'C', city: 'Flushing' },
  { firstName: 'Aisha', lastName: 'B', city: 'Bronx' },
  { firstName: 'Kevin', lastName: 'L', city: 'Bayside' },
  { firstName: 'Nina', lastName: 'S', city: 'Forest Hills' },
  { firstName: 'Omar', lastName: 'H', city: 'Jackson Heights' },
];

// Review templates by star rating
const REVIEW_TEMPLATES = {
  5: [
    { title: 'My pet loves it!', comment: 'Ordered this for my dog and he absolutely loves it. Delivery was super fast to Queens — came the next day. Will definitely order again!' },
    { title: 'Exactly as described', comment: 'Great quality, arrived quickly. My cat has been eating this for years and I\'m glad I found it here at a great price with fast NYC delivery.' },
    { title: 'Best price I found', comment: 'Searched everywhere and PetShiwu had the best price with free shipping over $49. Packaging was perfect, product is exactly what I needed.' },
    { title: 'Fast delivery, great product', comment: 'Arrived in 2 days to Jackson Heights. Product is high quality, my pets are happy and I\'m happy with the price. Highly recommend!' },
    { title: 'Highly recommend', comment: 'Finally a pet store that delivers to my neighborhood! Product quality is excellent and the price beat everywhere else I looked. 5 stars.' },
    { title: 'Outstanding quality', comment: 'This exceeded my expectations. My dog has more energy since switching to this food and her coat looks great. Fast shipping to Brooklyn.' },
    { title: 'Perfect for my picky eater', comment: 'My dog is very picky but loves this. Ordered twice now and always arrives fast. Great to have a reliable pet store that delivers to NYC.' },
  ],
  4: [
    { title: 'Good product, fast shipping', comment: 'Really happy with this purchase. Product is good quality and arrived quickly. Just docking one star because the packaging had a small dent but the product inside was fine.' },
    { title: 'My pet approves', comment: 'My cat took to this right away. Good quality ingredients and fast delivery to my neighborhood. Would order again.' },
    { title: 'Solid purchase', comment: 'Good value for the price. Product arrived well-packaged and my pet enjoys it. Delivery to Queens was faster than I expected.' },
    { title: 'Happy with the purchase', comment: 'Works as advertised. My dog has been using this for a week and seems to love it. Will probably reorder when we run out.' },
  ],
  3: [
    { title: 'Decent but not perfect', comment: 'Product is okay. My pet likes it but I\'ve tried better. Delivery was fast though and the price was competitive. Might try a different variant next time.' },
  ],
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomReview(rating) {
  const templates = REVIEW_TEMPLATES[rating] || REVIEW_TEMPLATES[5];
  return templates[randomInt(0, templates.length - 1)];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB);

  // 1. Get or create seed reviewer users
  const reviewerUsers = [];
  for (const persona of REVIEWERS) {
    const email = `${persona.firstName.toLowerCase()}.${persona.lastName.toLowerCase()}@petshiwu-seed.com`;
    let user = await db.collection('users').findOne({ email });
    if (!user) {
      const result = await db.collection('users').insertOne({
        firstName: persona.firstName,
        lastName: persona.lastName,
        email,
        password: 'seed_user_no_login',
        role: 'user',
        isVerified: true,
        isSeedUser: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      user = { _id: result.insertedId, ...persona };
    }
    reviewerUsers.push({ _id: user._id, firstName: persona.firstName });
  }
  console.log(`✅ ${reviewerUsers.length} reviewer users ready`);

  // 2. Get top 30 products — prioritize featured + high base price + keywords
  const products = await db.collection('products')
    .find({ isActive: true })
    .sort({ isFeatured: -1, basePrice: -1 })
    .limit(50)
    .toArray();

  const topProducts = products.slice(0, 30);
  console.log(`✅ Found ${topProducts.length} products to seed reviews on`);

  // 3. Check existing review count
  const existingCount = await db.collection('reviews').countDocuments({ isSeedReview: true });
  if (existingCount > 0) {
    console.log(`⚠️  ${existingCount} seed reviews already exist. Skipping.`);
    await client.close();
    return;
  }

  // 4. Seed reviews
  let inserted = 0;
  for (const product of topProducts) {
    // Each product gets 3-7 reviews
    const reviewCount = randomInt(3, 7);
    const usedReviewers = new Set();

    for (let i = 0; i < reviewCount; i++) {
      // Pick a reviewer not already used for this product
      let reviewer;
      let attempts = 0;
      do {
        reviewer = reviewerUsers[randomInt(0, reviewerUsers.length - 1)];
        attempts++;
      } while (usedReviewers.has(reviewer._id.toString()) && attempts < 20);

      if (usedReviewers.has(reviewer._id.toString())) continue;
      usedReviewers.add(reviewer._id.toString());

      // Weight ratings: 60% 5-star, 30% 4-star, 10% 3-star
      const ratingRoll = randomInt(1, 10);
      const rating = ratingRoll <= 6 ? 5 : ratingRoll <= 9 ? 4 : 3;
      const template = randomReview(rating);

      const review = {
        product: product._id,
        user: reviewer._id,
        rating,
        title: template.title,
        comment: template.comment,
        verifiedPurchase: false,
        helpfulCount: randomInt(0, 5),
        helpfulUsers: [],
        notHelpfulCount: 0,
        notHelpfulUsers: [],
        isApproved: true,
        isSeedReview: true,
        createdAt: daysAgo(randomInt(3, 60)),
        updatedAt: daysAgo(randomInt(0, 3)),
      };

      await db.collection('reviews').insertOne(review);
      inserted++;
    }

    // Update product averageRating and totalReviews
    const productReviews = await db.collection('reviews')
      .find({ product: product._id, isApproved: true })
      .toArray();

    const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    await db.collection('products').updateOne(
      { _id: product._id },
      {
        $set: {
          averageRating: Math.round(avg * 10) / 10,
          totalReviews: productReviews.length,
        }
      }
    );
  }

  console.log(`✅ Inserted ${inserted} seed reviews across ${topProducts.length} products`);
  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
