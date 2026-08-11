import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import Blog from '../models/Blog';
import logger from '../utils/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Blog/article content audit — finds thin or near-duplicate articles that drag
 * domain quality (the biggest risk for a large, partly-templated blog catalog).
 * At scale, pruning/improving weak articles helps recovery more than adding more.
 *
 * Flags:
 *   - MISSING_META:  no metaDescription
 *   - SHORT:         body text shorter than MIN_BODY_CHARS (default 600)
 *   - DUP_TITLE:     identical normalized title shared by 2+ articles
 *   - DUP_INTRO:     identical first ~400 chars of body shared by 2+ articles
 *                    (catches mass-generated near-duplicate templates)
 *
 * Writes backend/blog-content-audit.csv and prints a summary. Read-only.
 * Usage: npm run audit-blog-content
 */
const MIN_BODY_CHARS = parseInt(process.env.MIN_BLOG_BODY_CHARS || '600', 10);
const INTRO_CHARS = 400;
const OUTPUT = path.join(__dirname, '../../blog-content-audit.csv');

const stripHtml = (s: string): string => String(s || '').replace(/<[^>]*>/g, ' ');
const normalize = (s: string): string => stripHtml(s).replace(/\s+/g, ' ').trim().toLowerCase();
const csvCell = (v: string): string => `"${String(v).replace(/"/g, '""')}"`;

const auditBlogContent = async () => {
  try {
    await connectDatabase();
    if (mongoose.connection.readyState !== 1) throw new Error('Database not connected');

    const blogs = await Blog.find({ isPublished: true })
      .select('title slug content excerpt metaDescription')
      .lean();

    logger.info(`\n🔍 Auditing ${blogs.length} published articles (min body = ${MIN_BODY_CHARS} chars)\n`);

    const byTitle = new Map<string, string[]>();
    const byIntro = new Map<string, string[]>();
    for (const b of blogs) {
      const title = normalize((b as any).title || '');
      const body = normalize((b as any).content || (b as any).excerpt || '');
      if (title) byTitle.set(title, [...(byTitle.get(title) || []), (b as any).slug]);
      if (body.length >= 50) {
        const intro = body.slice(0, INTRO_CHARS);
        byIntro.set(intro, [...(byIntro.get(intro) || []), (b as any).slug]);
      }
    }
    const dupTitle = new Set<string>();
    for (const [, slugs] of byTitle) if (slugs.length > 1) slugs.forEach((s) => dupTitle.add(s));
    const dupIntro = new Set<string>();
    for (const [, slugs] of byIntro) if (slugs.length > 1) slugs.forEach((s) => dupIntro.add(s));

    let missingMeta = 0, short = 0, dupT = 0, dupI = 0;
    const rows: string[] = ['slug,issues,body_length'];

    for (const b of blogs) {
      const slug = (b as any).slug || '';
      const body = normalize((b as any).content || (b as any).excerpt || '');
      const issues: string[] = [];
      if (!normalize((b as any).metaDescription || '')) { issues.push('MISSING_META'); missingMeta++; }
      if (body.length < MIN_BODY_CHARS) { issues.push('SHORT'); short++; }
      if (dupTitle.has(slug)) { issues.push('DUP_TITLE'); dupT++; }
      if (dupIntro.has(slug)) { issues.push('DUP_INTRO'); dupI++; }
      if (issues.length > 0) {
        rows.push([csvCell(slug), csvCell(issues.join('|')), String(body.length)].join(','));
      }
    }

    fs.writeFileSync(OUTPUT, rows.join('\n'), 'utf-8');

    logger.info('=== Blog Content Audit ===');
    logger.info(`  Total published articles : ${blogs.length}`);
    logger.info(`  Missing metaDescription  : ${missingMeta}`);
    logger.info(`  Short (< ${MIN_BODY_CHARS} chars)     : ${short}`);
    logger.info(`  Duplicate title          : ${dupT}`);
    logger.info(`  Duplicate intro (~${INTRO_CHARS}c)   : ${dupI}`);
    logger.info(`  Flagged rows written     : ${rows.length - 1}`);
    logger.info(`\n📄 Report: ${OUTPUT}`);
    logger.info('   Priority: DUP_INTRO/DUP_TITLE (near-duplicates hurt domain quality) → SHORT → MISSING_META.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    logger.error(`❌ Blog content audit failed: ${error?.message || String(error)}`);
    try { await mongoose.connection.close(); } catch { /* ignore */ }
    process.exit(1);
  }
};

auditBlogContent();
