import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import Product from '../models/Product';
import logger from '../utils/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Product content audit — finds thin/duplicate product pages that Google is most
 * likely to drop as "duplicate without user-selected canonical" or "crawled –
 * currently not indexed". Fixing these (unique, substantive descriptions) is the
 * biggest content lever for indexing recovery.
 *
 * Flags:
 *   - MISSING:    no description at all
 *   - SHORT:      description shorter than MIN_DESC_CHARS (default 200)
 *   - DUPLICATE:  identical normalized description shared by 2+ products
 *
 * Writes a CSV report to backend/product-content-audit.csv and prints a summary.
 * Read-only — never modifies data.
 *
 * Usage: npm run audit-product-content
 */
const MIN_DESC_CHARS = parseInt(process.env.MIN_DESC_CHARS || '200', 10);
const OUTPUT = path.join(__dirname, '../../product-content-audit.csv');

const stripHtml = (s: string): string => s.replace(/<[^>]*>/g, ' ');
const normalize = (s: string): string =>
  stripHtml(String(s || '')).replace(/\s+/g, ' ').trim().toLowerCase();

const csvCell = (v: string): string => `"${String(v).replace(/"/g, '""')}"`;

const auditProductContent = async () => {
  try {
    await connectDatabase();
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    const products = await Product.find({ isActive: true })
      .select('name slug description petType')
      .lean();

    logger.info(`\n🔍 Auditing ${products.length} active products (min description = ${MIN_DESC_CHARS} chars)\n`);

    const byNormalizedDesc = new Map<string, string[]>();
    for (const p of products) {
      const norm = normalize((p as any).description || '');
      if (norm.length === 0) continue;
      const arr = byNormalizedDesc.get(norm) || [];
      arr.push((p as any).slug);
      byNormalizedDesc.set(norm, arr);
    }
    const duplicateSlugs = new Set<string>();
    for (const [, slugs] of byNormalizedDesc) {
      if (slugs.length > 1) slugs.forEach((s) => duplicateSlugs.add(s));
    }

    let missing = 0;
    let short = 0;
    let duplicate = 0;
    const rows: string[] = ['slug,issue,description_length,pet_type'];

    for (const p of products) {
      const slug = (p as any).slug || '';
      const petType = (p as any).petType || '';
      const desc = normalize((p as any).description || '');
      const len = desc.length;
      const issues: string[] = [];
      if (len === 0) { issues.push('MISSING'); missing++; }
      else if (len < MIN_DESC_CHARS) { issues.push('SHORT'); short++; }
      if (duplicateSlugs.has(slug)) { issues.push('DUPLICATE'); duplicate++; }
      if (issues.length > 0) {
        rows.push([csvCell(slug), csvCell(issues.join('|')), String(len), csvCell(petType)].join(','));
      }
    }

    fs.writeFileSync(OUTPUT, rows.join('\n'), 'utf-8');

    const flagged = rows.length - 1;
    logger.info('=== Product Content Audit ===');
    logger.info(`  Total active products : ${products.length}`);
    logger.info(`  Missing description   : ${missing}`);
    logger.info(`  Short (< ${MIN_DESC_CHARS} chars)   : ${short}`);
    logger.info(`  Duplicate description : ${duplicate}`);
    logger.info(`  Flagged rows written  : ${flagged}`);
    logger.info(`\n📄 Report: ${OUTPUT}`);
    logger.info('   Fix priority: MISSING → DUPLICATE → SHORT (unique, substantive copy).\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    logger.error(`❌ Product content audit failed: ${error?.message || String(error)}`);
    try { await mongoose.connection.close(); } catch { /* ignore */ }
    process.exit(1);
  }
};

auditProductContent();
