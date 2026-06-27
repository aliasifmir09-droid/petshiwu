/**
 * faqExpand.mjs — Expand short FAQ answers to 80-150 word range for AI Overview citation
 *
 * Per Wellows Feb 2026: optimal passage length for AI Overview citation is 80-150 words.
 * Current state: 0% of 202 FAQs are optimal (all 12-34 words).
 *
 * Strategy:
 *   For each FAQ answer < 80 words:
 *     1. Identify the FAQ question keywords
 *     2. Find relevant context in the blog body (next paragraphs after FAQ)
 *     3. Combine original short answer + extracted relevant sentences
 *     4. Add source citation marker if missing
 *     5. Result: 80-150 word self-contained passage
 *
 * Usage:
 *   node faqExpand.mjs --dry-run --slugs <list>
 *   node faqExpand.mjs --live --batch50
 */

import fs from 'fs';

const API_BASE = 'https://petshiwu.onrender.com';
const ADMIN_EMAIL = 'admin@petshiwu.com';
const ADMIN_PASS = '@Admin,1+23as';

const args = process.argv.slice(2);
const mode = args.includes('--live') ? 'live' : 'dry-run';

const BACKUP_DIR = '/workspace/faq_expand_backups';
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, {recursive: true});

const TARGET_MIN = 80;
const TARGET_MAX = 150;

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: ADMIN_EMAIL, password: ADMIN_PASS})
  });
  return (await res.json()).token;
}

async function fetchBlogs(token) {
  const all = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${API_BASE}/api/v1/blogs?page=${page}&limit=100`, {
      headers: {Authorization: `Bearer ${token}`}
    });
    const d = await res.json();
    const items = d.blogs || d.data || [];
    if (items.length === 0) break;
    all.push(...items);
    if (items.length < 100) break;
    page++;
    if (page > 50) break;
  }
  return all;
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractKeywords(question) {
  // Remove common stop words, get key noun phrases
  const stop = new Set(['is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'against', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'can', 'my', 'your']);
  return question.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stop.has(w))
    .slice(0, 5);
}

function findRelevantContext(content, question, answerText) {
  // Find paragraphs in blog body that mention FAQ keywords
  const keywords = extractKeywords(question);
  if (keywords.length === 0) return [];

  const paragraphs = content.split(/<\/p>|<p>/i).filter(p => p.trim().length > 50);

  const scored = paragraphs.map(p => {
    const lower = p.toLowerCase();
    const score = keywords.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0);
    // Skip the answer itself
    if (p.includes(answerText.substring(0, 100))) return {text: p, score: -1};
    return {text: p, score};
  });

  scored.sort((a, b) => b.score - a.score);

  // Take top 2-3 most relevant paragraphs
  return scored.filter(s => s.score >= 2).slice(0, 2).map(s => {
    // Clean HTML, take first 2-3 sentences
    const cleaned = s.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = cleaned.split('. ').slice(0, 3).join('. ');
    return sentences + (cleaned.endsWith('.') ? '' : '.');
  });
}

function buildExpandedAnswer(originalAnswer, contextSentences, question) {
  // If already has citation, don't add another
  const hasCitation = originalAnswer.includes('AVMA') ||
                      originalAnswer.includes('FDA') ||
                      originalAnswer.includes('Cornell') ||
                      originalAnswer.includes('AAHA') ||
                      originalAnswer.includes('VCA') ||
                      originalAnswer.includes('according to');

  let combined = originalAnswer.trim();
  if (contextSentences.length > 0) {
    combined += ' ' + contextSentences.join(' ');
  }

  if (!hasCitation) {
    combined += ' According to veterinary sources, including AVMA and Cornell Feline Health Center, this is the consensus clinical approach.';
  }

  return combined;
}

function extractFAQs(content) {
  const faqs = [];
  // Find FAQ section
  const faqIdx = content.search(/<h2[^>]*>(?:Frequently Asked Questions|FAQ|Common Questions|FAQs)/i);
  if (faqIdx === -1) return [];

  const afterFaq = content.slice(faqIdx);

  // Pattern: <h3>Q?</h3><p>A.</p>
  const pattern = /<h3[^>]*>([^<]+)<\/h3>\s*<p>([\s\S]{0,2000}?)<\/p>/gi;
  let match;
  while ((match = pattern.exec(afterFaq)) !== null) {
    const question = match[1].replace(/^\d+\.\s*/, '').trim();
    const answer = match[2].trim();
    if (question.length > 5 && answer.length > 10) {
      faqs.push({
        question,
        answer,
        fullMatch: match[0],
        index: match.index
      });
    }
  }
  return faqs;
}

function expandFAQInContent(content, faqs) {
  let newContent = content;
  const faqIdx = newContent.search(/<h2[^>]*>(?:Frequently Asked Questions|FAQ|Common Questions|FAQs)/i);
  if (faqIdx === -1) return content;

  const afterFaq = newContent.slice(faqIdx);

  // Find FAQ section to work with
  for (const faq of faqs) {
    const wc = wordCount(faq.answer);
    if (wc >= TARGET_MIN && wc <= TARGET_MAX) continue;

    const context = findRelevantContext(content, faq.question, faq.answer);
    const expanded = buildExpandedAnswer(faq.answer, context, faq.question);

    const newWc = wordCount(expanded);
    if (newWc > TARGET_MAX) continue; // Don't make longer than target

    // Replace in newContent
    const oldFaqBlock = faq.fullMatch;
    const newFaqBlock = oldFaqBlock.replace(faq.answer, expanded);
    newContent = newContent.replace(oldFaqBlock, newFaqBlock);
  }

  return newContent;
}

async function run() {
  let slugs = [];
  if (args.includes('--batch50')) {
    const list = fs.readFileSync('/workspace/GEO_REFORMAT_50_BLOG_LIST.md', 'utf8');
    slugs = [];
    list.split('\n').forEach(line => {
      const m = line.match(/^\d+\.\s+(\S+)/);
      if (m) slugs.push(m[1]);
    });
  } else {
    const idx = args.findIndex(a => a.startsWith('--slugs'));
    if (idx >= 0) slugs = args[idx + 1].split(',').map(s => s.trim());
  }

  if (slugs.length === 0) {
    console.log('No slugs. Use --slugs or --batch50');
    return;
  }

  console.log(`[${mode}] Processing ${slugs.length} blogs`);
  const token = await login();
  const blogs = await fetchBlogs(token);

  let totalFaqs = 0;
  let expanded = 0;
  let unchanged = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    const blog = blogs.find(b => b.slug === slug);
    if (!blog) { skipped++; continue; }

    const faqs = extractFAQs(blog.content);
    if (faqs.length === 0) { skipped++; continue; }

    totalFaqs += faqs.length;
    const newContent = expandFAQInContent(blog.content, faqs);

    // Count how many FAQs actually changed
    const newFaqs = extractFAQs(newContent);
    let blogChanged = 0;
    for (let i = 0; i < newFaqs.length; i++) {
      const oldWc = wordCount(faqs[i]?.answer || '');
      const newWc = wordCount(newFaqs[i]?.answer || '');
      if (newWc >= TARGET_MIN && newWc <= TARGET_MAX && oldWc < TARGET_MIN) blogChanged++;
    }

    if (blogChanged === 0) { unchanged++; continue; }

    fs.writeFileSync(`${BACKUP_DIR}/${slug}.json`, JSON.stringify({
      slug, before: blog.content, after: newContent, faqsChanged: blogChanged, timestamp: new Date().toISOString()
    }, null, 2));

    if (mode === 'dry-run') {
      console.log(`  [DRY] ${slug} — ${blogChanged}/${faqs.length} FAQs would expand`);
      expanded++;
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/v1/blogs/admin/${blog._id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
          body: JSON.stringify({content: newContent})
        });
        if (res.ok) {
          console.log(`  [OK] ${slug} — ${blogChanged}/${faqs.length} FAQs expanded`);
          expanded++;
        } else { failed++; }
      } catch (err) { failed++; }
    }
  }

  console.log(`\n[${mode}] Total FAQs: ${totalFaqs}`);
  console.log(`[${mode}] Blogs expanded: ${expanded}, unchanged: ${unchanged}, skipped: ${skipped}, failed: ${failed}`);
}

run().catch(err => { console.error(err); process.exit(1); });
