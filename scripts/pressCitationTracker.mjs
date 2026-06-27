/**
 * pressCitationTracker.mjs — Track which FREEDOM20 PR targets have actually published
 *
 * Purpose: Wait for 3+ independent press citations before triggering
 * Wikipedia + Wikidata submission. Runs weekly (or on-demand).
 *
 * Usage:
 *   node pressCitationTracker.mjs              # full check, all 40 outlets
 *   node pressCitationTracker.mjs --quick      # only top 10 outlets
 *
 * Output:
 *   /workspace/press_citation_status.md
 *   Console: count of citations, list of outlets that published
 *   Exit code: 0 if <3 citations, 1 if 3+ (trigger Wikipedia/Wikidata submission)
 */

import fs from 'fs';

const args = process.argv.slice(2);
const quick = args.includes('--quick');

// Top 40 outlets from FREEDOM20_PR_TARGETS.md, with search query per outlet
const OUTLETS = [
  // Tier 1: NYC business
  {name: 'Crain\'s New York', search: '"Petshiwu" site:crainsnewyork.com', category: 'NYC business'},
  {name: 'NY Post', search: '"Petshiwu" site:nypost.com', category: 'NYC business'},
  {name: 'Bloomberg', search: '"Petshiwu" site:bloomberg.com', category: 'NYC business'},
  {name: 'amNY', search: '"Petshiwu" site:amny.com', category: 'NYC business'},
  // Tier 2: Retail/e-commerce trade
  {name: 'Modern Retail', search: '"Petshiwu" site:modernretail.co', category: 'Retail trade'},
  {name: 'Retail Brew', search: '"Petshiwu" site:retailbrew.com', category: 'Retail trade'},
  {name: 'Glossy', search: '"Petshiwu" site:glossy.co', category: 'Retail trade'},
  {name: 'Future Commerce', search: '"Petshiwu" site:futurecommerce.com', category: 'Retail trade'},
  // Tier 3: Pet industry trade
  {name: 'Pet Age', search: '"Petshiwu" site:petage.com', category: 'Pet trade'},
  {name: 'Pet Business', search: '"Petshiwu" site:petbusiness.com', category: 'Pet trade'},
  {name: 'Petfood Industry', search: '"Petshiwu" site:petfoodindustry.com', category: 'Pet trade'},
  // Tier 4: NYC local press
  {name: 'QNS.com', search: '"Petshiwu" site:qns.com', category: 'NYC local'},
  {name: 'Queens Chronicle', search: '"Petshiwu" site:queenschronicle.com', category: 'NYC local'},
  {name: 'Brooklyn Paper', search: '"Petshiwu" site:brooklynpaper.com', category: 'NYC local'},
  {name: 'Gothamist', search: '"Petshiwu" site:gothamist.com', category: 'NYC local'},
  {name: 'TimeOut NY', search: '"Petshiwu" site:timeout.com/newyork', category: 'NYC local'},
  {name: 'BK Reader', search: '"Petshiwu" site:bkmagazine.com OR site:bkreader.com', category: 'NYC local'},
  // Tier 5: Podcast/Newsletter
  {name: 'No Bad Dogs Podcast', search: '"Petshiwu" "No Bad Dogs"', category: 'Podcast'},
  {name: 'Pets and the City (Substack)', search: '"Petshiwu" substack.com', category: 'Newsletter'},
  // Tier 6: Tech/startup
  {name: 'Indie Hackers', search: '"Petshiwu" site:indiehackers.com', category: 'Startup'},
  {name: 'Crunchbase', search: '"Petshiwu" site:crunchbase.com', category: 'Startup'},
  {name: 'Product Hunt', search: '"Petshiwu" site:producthunt.com', category: 'Startup'},
  // Tier 7: National business
  {name: 'Forbes', search: '"Petshiwu" site:forbes.com', category: 'National business'},
  {name: 'Inc.com', search: '"Petshiwu" site:inc.com', category: 'National business'},
  {name: 'Fast Company', search: '"Petshiwu" site:fastcompany.com', category: 'National business'},
  {name: 'Wall Street Journal', search: '"Petshiwu" site:wsj.com', category: 'National business'},
  {name: 'NY Times', search: '"Petshiwu" site:nytimes.com', category: 'National business'},
  // Tier 8: Additional NYC
  {name: 'Brownstoner', search: '"Petshiwu" site:brownstoner.com', category: 'NYC local'},
  {name: '6sqft', search: '"Petshiwu" site:6sqft.com', category: 'NYC local'},
  {name: 'EV Grieve', search: '"Petshiwu" site:evgrieve.com', category: 'NYC local'},
  {name: 'Bushwick Daily', search: '"Petshiwu" site:bushwickdaily.com', category: 'NYC local'},
  {name: 'Patch NYC', search: '"Petshiwu" site:patch.com/new-york', category: 'NYC local'},
  // Tier 9: Lifestyle
  {name: 'The Cut (NY Mag)', search: '"Petshiwu" site:thecut.com', category: 'Lifestyle'},
  {name: 'New York Magazine', search: '"Petshiwu" site:nymag.com', category: 'Lifestyle'},
  {name: 'Bon Appétit', search: '"Petshiwu" site:bonappetit.com', category: 'Lifestyle'},
  // Tier 10: Reddit
  {name: 'Reddit r/nyc', search: '"Petshiwu" site:reddit.com/r/nyc', category: 'Reddit'},
  {name: 'Reddit r/pets', search: '"Petshiwu" site:reddit.com/r/pets', category: 'Reddit'},
];

async function checkOutlet(outlet) {
  // Use Google site: search via Brave API (search results)
  try {
    const res = await fetch(`https://search.brave.com/api/suggest?q=${encodeURIComponent(outlet.search)}`, {
      headers: {'User-Agent': 'Mozilla/5.0'}
    });
    // This is a simplified check — in production would use real search API
    return { published: false, url: null, status: 'check_pending' };
  } catch (err) {
    return { published: false, url: null, status: 'check_failed', error: err.message };
  }
}

async function manualCitationCheck() {
  // For demo / dry-run purposes, prompt user to manually verify
  console.log('\n=== Press Citation Manual Verification ===');
  console.log('Run these searches to verify which outlets have published:');
  console.log('');
  for (const outlet of OUTLETS) {
    console.log(`[${outlet.category.padEnd(15)}] ${outlet.name}`);
    console.log(`  Search: ${outlet.search}`);
  }
  console.log('\nAfter manual check, run with --confirm <outlet1,outlet2>');
}

async function run() {
  const targets = quick ? OUTLETS.slice(0, 10) : OUTLETS;
  console.log(`Checking ${targets.length} outlets...`);

  const results = [];
  for (const outlet of targets) {
    const check = await checkOutlet(outlet);
    results.push({outlet, ...check});
  }

  // Generate status report
  const report = ['# Press Citation Status — Petshiwu FREEDOM20 Cycle', '', `Generated: ${new Date().toISOString()}`, '', '---', ''];

  let cited = 0;
  for (const r of results) {
    const icon = r.published ? '✓' : '○';
    report.push(`## ${icon} ${r.outlet.name}`);
    report.push(`**Category:** ${r.outlet.category}`);
    report.push(`**Search:** \`${r.outlet.search}\``);
    report.push(`**Status:** ${r.status}`);
    if (r.published && r.url) {
      report.push(`**URL:** ${r.url}`);
      cited++;
    }
    report.push('');
  }

  report.push('---', '');
  report.push('## Citation Count', '');
  report.push(`Citations landed: **${cited}**`);
  report.push(`Wikipedia submission threshold: 3+`);
  report.push(`Status: ${cited >= 3 ? '✅ READY TO SUBMIT' : '⏳ Need ' + (3 - cited) + ' more'}`);

  fs.writeFileSync('/workspace/press_citation_status.md', report.join('\n'));
  console.log(`\nReport written: /workspace/press_citation_status.md`);
  console.log(`Citations: ${cited} / 3+ threshold`);

  if (cited >= 3) {
    console.log('\n🚨 READY TO SUBMIT WIKIPEDIA + WIKIDATA 🚨');
    console.log('Run:');
    console.log('  1. Update /workspace/WIKIPEDIA_PETSHIWU_DRAFT.md with real press URLs');
    console.log('  2. node wikidataSubmit.mjs --dry-run (verify payload)');
    console.log('  3. Submit Wikipedia via AfC: https://en.wikipedia.org/wiki/Wikipedia:Articles_for_creation');
    console.log('  4. node wikidataSubmit.mjs --live (after Wikipedia approved)');
    process.exit(1); // Signal ready
  }
}

// Manual confirmation flow
if (args.includes('--confirm')) {
  const idx = args.indexOf('--confirm');
  const confirmed = args[idx + 1]?.split(',') || [];
  console.log('Confirmed citations:', confirmed);
  console.log('TODO: update press_citation_status.md with confirmed outlets');
  console.log('TODO: trigger Wikipedia/Wikidata submission if 3+ confirmed');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
