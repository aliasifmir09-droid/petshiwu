#!/usr/bin/env node
/**
 * Fix HTML entities in product descriptions directly via MongoDB.
 * Bypasses the Express API entirely — no rate limiting, no middleware re-encoding.
 *
 * Usage:
 *   MONGO_URI="mongodb+srv://..." node scripts/fixDescriptionsMongo.mjs
 *   or set MONGO_URI in .env and run: node -r dotenv/config scripts/fixDescriptionsMongo.mjs
 */

import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Error: MONGO_URI environment variable is not set.');
  console.error('Usage: MONGO_URI="mongodb+srv://..." node scripts/fixDescriptionsMongo.mjs');
  process.exit(1);
}

const DB_NAME = 'petshop';
const COLLECTION = 'products';

// Match any HTML entity: &amp; &#039; &lt; &gt; &quot; &#x27; etc.
const ENTITY_RE = /&(?:#\d+|#x[\da-fA-F]+|amp|lt|gt|quot|apos|nbsp);/;

/** Decode HTML entities iteratively until fully stable. */
function decodeEntities(text) {
  if (!text || typeof text !== 'string') return text;
  // Import-free approach: manual decoding for the entities we know are present.
  // Handles double/triple encoding by looping until stable.
  let prev;
  do {
    prev = text;
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&#0*39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, '\u00a0');
  } while (prev !== text);
  return text;
}

async function main() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  const total = await col.countDocuments();
  console.log(`Total products: ${total}\n`);

  let fixed = 0;
  let clean = 0;
  let errors = 0;
  let processed = 0;
  const start = Date.now();

  const cursor = col.find({}, { projection: { _id: 1, description: 1, shortDescription: 1 } });

  for await (const product of cursor) {
    try {
      const desc = product.description || '';
      const short = product.shortDescription || '';

      const descNeedsFix = ENTITY_RE.test(desc);
      const shortNeedsFix = ENTITY_RE.test(short);

      if (!descNeedsFix && !shortNeedsFix) {
        clean++;
      } else {
        const update = {};
        if (descNeedsFix) update.description = decodeEntities(desc);
        if (shortNeedsFix) update.shortDescription = decodeEntities(short);

        await col.updateOne({ _id: product._id }, { $set: update });
        fixed++;
      }
    } catch (e) {
      errors++;
    }

    processed++;
    if (processed % 500 === 0) {
      const elapsed = (Date.now() - start) / 1000;
      const rate = Math.round(processed / elapsed);
      console.log(`[${processed}/${total}] fixed=${fixed} clean=${clean} errors=${errors} | ${rate}/s`);
    }
  }

  await cursor.close();
  await client.close();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s`);
  console.log(`Fixed: ${fixed} | Clean: ${clean} | Errors: ${errors}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
