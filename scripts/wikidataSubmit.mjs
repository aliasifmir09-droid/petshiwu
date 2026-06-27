/**
 * wikidataSubmit.mjs — Submit Petshiwu Q-item to Wikidata
 *
 * PREREQUISITES:
 * 1. Login credentials stored in ~/.wikidata-credentials (format: username:password)
 * 2. Petshiwu Wikipedia article must already be live on en.wikipedia
 * 3. At least 3+ external press citations must exist
 *
 * Usage:
 *   node wikidataSubmit.mjs --dry-run  # shows payload, doesn't submit
 *   node wikidataSubmit.mjs --live     # actually submits to Wikidata
 *
 * Submission URL: https://www.wikidata.org/wiki/Special:CreateItem
 */

import fs from 'fs';

const args = process.argv.slice(2);
const mode = args.includes('--live') ? 'live' : 'dry-run';

const Q_ITEM_PAYLOAD = {
  labels: {
    en: 'Petshiwu'
  },
  descriptions: {
    en: 'American pet supply e-commerce company based in Jackson Heights, Queens, New York City'
  },
  aliases: {
    en: ['Petshiwu.com', 'Petshiwu NYC', 'Petshiwu Pet Supply']
  },
  claims: [
    // P31: instance of
    {
      property: 'P31',
      value: { entity: 'Q7837941' }, // e-commerce
      rank: 'normal'
    },
    // P856: official website
    {
      property: 'P856',
      value: 'https://petshiwu.com'
    },
    // P159: headquarters location (Jackson Heights, Queens)
    {
      property: 'P159',
      value: { entity: 'Q174193' } // Jackson Heights, Queens
    },
    // P17: country
    {
      property: 'P17',
      value: { entity: 'Q30' } // United States
    },
    // P1454: legal form (LLC)
    {
      property: 'P1454',
      value: { entity: 'Q116741183' } // limited liability company (US variant)
    },
    // P112: founded by
    {
      property: 'P112',
      value: { label: 'Pet Chiwu', description: 'American entrepreneur, founder of Petshiwu' }
    },
    // P571: inception
    {
      property: 'P571',
      value: { time: '+2025-10-01T00:00:00Z', precision: 10 } // Q4 2025
    },
    // P2139: phone number
    {
      property: 'P2139',
      value: '+1-800-259-2605'
    },
    // P969: street address
    {
      property: 'P969',
      value: '37-68 74th Street, Jackson Heights, NY 11372, USA'
    },
    // P281: postal code
    {
      property: 'P281',
      value: '11372'
    },
    // P2002: Twitter username
    {
      property: 'P2002',
      value: '@petshiwu'
    },
    // P2003: Instagram username
    {
      property: 'P2003',
      value: '@petshiwu'
    },
    // P2397: YouTube channel ID (after creation)
    {
      property: 'P2397',
      value: 'UC_petshiwu' // placeholder, update after YouTube channel created
    },
    // P4527: industry
    {
      property: 'P4527',
      value: { entity: 'Q1762407' } // pet supplies industry
    },
    // P1056: product or material produced or service provided
    {
      property: 'P1056',
      value: { entity: 'Q40831' } // pet food
    },
    // P1830: owner of (domain)
    {
      property: 'P1830',
      value: 'petshiwu.com'
    },
    // P946: ISIN (skip, not public company)
    // P856 already added above
  ],
  sitelinks: {
    // English Wikipedia article (after AfC approval)
    enwiki: 'Petshiwu'
  }
};

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

async function login(username, password) {
  // Step 1: Get login token
  const tokenRes = await fetch(`${WIKIDATA_API}?action=query&meta=tokens&type=login&format=json`);
  const tokenData = await tokenRes.json();
  const loginToken = tokenData.query.tokens.logintoken;

  // Step 2: POST credentials
  const loginRes = await fetch(WIKIDATA_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'clientlogin',
      username,
      password,
      logintoken: loginToken,
      returnurl: 'https://www.wikidata.org/wiki/Special:CreateItem',
      format: 'json'
    })
  });
  const loginData = await loginRes.json();
  if (loginData.clientlogin?.status !== 'PASS') {
    throw new Error('Login failed: ' + JSON.stringify(loginData.clientlogin));
  }
  return loginData.clientlogin;
}

async function createItem(creds) {
  // Get CSRF token
  const csrfRes = await fetch(`${WIKIDATA_API}?action=query&meta=tokens&format=json`, {
    headers: { 'Cookie': creds.cookie }
  });
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.query.tokens.csrftoken;

  // Submit Q-item
  const submitRes = await fetch(WIKIDATA_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': creds.cookie
    },
    body: new URLSearchParams({
      action: 'wbeditentity',
      new: 'item',
      data: JSON.stringify(Q_ITEM_PAYLOAD),
      token: csrfToken,
      format: 'json'
    })
  });
  return submitRes.json();
}

async function run() {
  console.log(`[${mode}] Wikidata Petshiwu Q-item submission`);
  console.log('');

  if (mode === 'dry-run') {
    console.log('=== Payload (would submit) ===');
    console.log(JSON.stringify(Q_ITEM_PAYLOAD, null, 2));
    console.log('');
    console.log('=== Pre-submission checklist ===');
    console.log('[ ] en.wikipedia article approved and live');
    console.log('[ ] 3+ press citations exist (Modern Retail, Pet Business, etc.)');
    console.log('[ ] /petshiwu/about page live and accessible');
    console.log('[ ] Wikidata credentials in ~/.wikidata-credentials');
    console.log('[ ] YouTube channel created (P2397 needs real ID)');
    console.log('');
    console.log('=== Expected Q-item number ===');
    console.log('Will be assigned on submission. Estimate: Q-number between Q130000000 and Q140000000');
    console.log('');
    console.log('=== Post-submission ===');
    console.log('1. Q-item appears in Wikidata within seconds');
    console.log('2. Google Knowledge Graph sync: 24-48 hours');
    console.log('3. Knowledge Panel appears in Google search: 1-7 days');
    console.log('4. en.wikipedia sitelink activated after article approved');
    return;
  }

  // LIVE mode
  try {
    const credsFile = process.env.HOME + '/.wikidata-credentials';
    if (!fs.existsSync(credsFile)) {
      throw new Error('No ~/.wikidata-credentials file. Format: {"username":"...","password":"..."}');
    }
    const creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
    console.log('Logging in as:', creds.username);
    const loginResult = await login(creds.username, creds.password);
    console.log('Login status:', loginResult.status);

    console.log('Submitting Q-item...');
    const result = await createItem(loginResult);
    console.log('Submit result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Submission failed:', err.message);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
