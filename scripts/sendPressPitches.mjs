/**
 * sendPressPitches.mjs — Send FREEDOM20 press pitches via Resend
 *
 * From: support@petshiwu.com (verified domain in Resend)
 * Reply-to: petchiwu@gmail.com (Pet's personal Gmail)
 *
 * Sends the 6 pitches from /workspace/PITCH_OUTREACH_NYC_PET_CREATORS.md:
 *   1. No Bad Dogs Podcast (Tom Davis)
 *   2. Dog Save The People (John Bartlett)
 *   3. Down and Back AKC Podcast (Bud Boccone)
 *   4. School For The Dogs (Annie Grossman)
 *   5. Pets and the City Substack (Dr. Amy Attas)
 *   6. Dogs & the City Substack (Isabel Klee)
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx node scripts/sendPressPitches.mjs --dry-run
 *   RESEND_API_KEY=re_xxx node scripts/sendPressPitches.mjs --live
 */

import { Resend } from '/workspace/petshiwu/backend/node_modules/resend/dist/index.mjs';

const args = process.argv.slice(2);
const mode = args.includes('--live') ? 'live' : 'dry-run';

const FROM_EMAIL = 'Pet Chiwu <support@petshiwu.com>';
const REPLY_TO = 'petchiwu@gmail.com';

// Pitch definitions — full bodies in /workspace/PITCH_OUTREACH_NYC_PET_CREATORS.md
const PITCHES = [
  {
    id: 'nobaddogs',
    outlet: 'No Bad Dogs Podcast',
    toEmail: 'hello@nobaddogspodcast.com',
    subject: 'NYC pet supply founder — competing with Chewy without autoship',
    contact: 'Tom Davis',
    notes: 'Tom Davis Albany NY, 480K Facebook reach'
  },
  {
    id: 'dogsavepeople',
    outlet: 'Dog Save The People',
    toEmail: 'hello@dogsavehtepeople.com',
    subject: 'NYC founder + no-autoship pet delivery story (19 min)',
    contact: 'John Bartlett',
    notes: 'John Bartlett NYC, 19 min format'
  },
  {
    id: 'downbackakc',
    outlet: 'Down and Back: AKC Dog Podcast',
    toEmail: 'downandback@akc.org',
    subject: 'NYC pet supply founder interview — independent vs subscription',
    contact: 'Bud Boccone',
    notes: 'AKC institutional podcast, 4.4M Facebook parent network'
  },
  {
    id: 'schoolfordogs',
    outlet: 'How To Train Your Dog With Love + Science',
    toEmail: 'annie@schoolforthedogs.com',
    subject: 'NYC pet supply founder — local angle for your listeners',
    contact: 'Annie Grossman',
    notes: 'Annie Grossman NYC, 4.7★ Apple rating'
  },
  {
    id: 'petsandcity',
    outlet: 'Pets and the City (Substack)',
    toEmail: 'amy@citypetsvets.com',
    subject: 'NYC vet-relevant product sourcing for your readers',
    contact: 'Dr. Amy Attas',
    notes: 'Manhattan vet, 33+ years, E-E-A-T gold standard'
  },
  {
    id: 'dogsandcity',
    outlet: 'Dogs & the City (Substack)',
    toEmail: 'isabel@isabelklee.com',
    subject: 'NYC pet parent guest essay — why I started Petshiwu',
    contact: 'Isabel Klee',
    notes: 'Tens of thousands subscribers, personal essays + Q&A'
  }
];

function loadPitchBody(id) {
  // Full bodies are in /workspace/PITCH_OUTREACH_NYC_PET_CREATORS.md
  const fs = require('fs');
  const md = fs.readFileSync('/workspace/PITCH_OUTREACH_NYC_PET_CREATORS.md', 'utf8');
  // Find the section with the outlet name and extract body up to the next pitch
  const pitch = PITCHES.find(p => p.id === id);
  if (!pitch) return '';
  const startPattern = new RegExp(`### PITCH EMAIL\\s*\\*\\*Subject:\\*\\* ${pitch.subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  const startMatch = md.match(startPattern);
  if (!startMatch) return '';
  const startIdx = startMatch.index + startMatch[0].length;
  // Find next ### or --- 
  const endMatch = md.slice(startIdx).match(/^### PITCH EMAIL|^--- /m);
  const endIdx = endMatch ? startIdx + endMatch.index : md.length;
  return md.slice(startIdx, endIdx).trim();
}

async function run() {
  console.log(`[${mode}] Press pitch sender — ${PITCHES.length} pitches ready`);
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`Reply-to: ${REPLY_TO}`);
  console.log('');

  if (mode === 'dry-run' || !process.env.RESEND_API_KEY) {
    console.log('=== DRY RUN: Showing all 6 pitches ===\n');
    for (let i = 0; i < PITCHES.length; i++) {
      const p = PITCHES[i];
      const body = loadPitchBody(p.id);
      console.log(`\n--- PITCH ${i+1}/${PITCHES.length}: ${p.outlet} ---`);
      console.log(`To: ${p.toEmail}`);
      console.log(`Subject: ${p.subject}`);
      console.log(`Notes: ${p.notes}`);
      console.log(`Body length: ${body.length} chars`);
    }
    console.log('\n=== Sending options ===');
    console.log('Live: RESEND_API_KEY=re_xxx node scripts/sendPressPitches.mjs --live');
    console.log('');
    console.log('⚠ Verify recipient emails before sending.');
    console.log('   Check Feedspot paid tier for podcast contacts.');
    console.log('   Verify citypetsvets.com and isabelklee.com via direct outreach.');
    return;
  }

  // LIVE send
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0, failed = 0;

  for (let i = 0; i < PITCHES.length; i++) {
    const p = PITCHES[i];
    const body = loadPitchBody(p.id);
    console.log(`[${i+1}/${PITCHES.length}] Sending to ${p.outlet}...`);
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: p.toEmail,
        replyTo: REPLY_TO,
        subject: p.subject,
        text: body,
        tags: [{name: 'campaign', value: 'freedom20-press'}, {name: 'outlet', value: p.id}]
      });
      if (result.error) {
        console.log(`  [FAIL] ${result.error.message}`);
        failed++;
      } else {
        console.log(`  [OK] ${p.outlet} — id ${result.data?.id}`);
        sent++;
      }
    } catch (err) {
      console.log(`  [FAIL] ${err.message}`);
      failed++;
    }
  }

  console.log(`\n[${mode}] Done: ${sent} sent, ${failed} failed`);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
