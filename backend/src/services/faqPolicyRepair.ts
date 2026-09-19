import FAQ from '../models/FAQ';
import logger from '../utils/logger';
import { cache, cacheKeys } from '../utils/cache';

export type FaqRepairPlan = {
  match: RegExp;
  question?: string;
  answer: string;
  category?: string;
};

export const FAQ_POLICY_REPAIRS: FaqRepairPlan[] = [
  {
    match: /are pitshiwu products safe/i,
    question: 'Are Petshiwu products safe for my pets?',
    answer:
      'Yes. We sell established pet-food and supply brands. Follow the label for your pet’s age and health, and ask your veterinarian before switching food or using a new supplement.',
  },
  {
    match: /when should i worry about my cat/i,
    question: 'When should I worry about my cat’s hair loss?',
    answer:
      'See a veterinarian if you notice bald patches, red or inflamed skin, excessive scratching, or over-grooming in one area. Those can be signs of allergies, parasites, or stress — not a reason to wait.',
  },
  {
    match: /can i change or cancel my order/i,
    answer:
      'Yes, if the order has not shipped. Email support@petshiwu.com within 2 hours of placing it. After it ships, use the 365-day return policy at petshiwu.com/return-policy.',
  },
  {
    match: /what is your return and refund policy/i,
    answer:
      'Unused items in original packaging can be returned within 365 days of delivery. Unopened food, treats, and supplements are included. Opened food, treats, or supplements can only be returned if they arrived damaged, defective, or incorrect. Customer-initiated return shipping is paid by you; damaged, defective, or wrong items ship back free. Refunds go to the original payment method in 5–10 business days after we inspect the return. Start at petshiwu.com/return-policy or email support@petshiwu.com.',
  },
  {
    match: /how long does it take to deliver my order/i,
    answer:
      'NYC same-day: order by 3 PM ET weekdays or 1 PM ET weekends and we aim to deliver before 11 PM across all five boroughs. After cutoff we deliver the next day. Same-day is our target, not a guarantee. If we miss the window, email support@petshiwu.com and we will reship the next day free or refund the order.',
  },
  {
    match: /how much does shipping cost/i,
    answer:
      'Delivery is $6 on orders under $49 and free on orders $49 and over. Same-day in NYC. Nationwide shipping soon.',
  },
];

export function planFaqRepair(question: string, answer: string): FaqRepairPlan | null {
  const haystack = `${question} ${answer}`;
  return FAQ_POLICY_REPAIRS.find((plan) => plan.match.test(haystack) || plan.match.test(question)) || null;
}

export async function repairFaqPolicies(): Promise<void> {
  try {
    let changed = 0;
    const published = await FAQ.find({ isPublished: true }).select('question answer category isPublished');

    const furnitureKey = /why does my cat scratch the furniture/i;
    const furniture = published.filter((faq) => furnitureKey.test(faq.question || ''));
    for (const extra of furniture.slice(1)) {
      extra.isPublished = false;
      await extra.save();
      changed += 1;
    }

    const seenQuestions = new Set<string>();
    for (const faq of published) {
      if (faq.isPublished === false) continue;
      const key = String(faq.question || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!key) continue;
      if (seenQuestions.has(key)) {
        faq.isPublished = false;
        await faq.save();
        changed += 1;
        continue;
      }
      seenQuestions.add(key);
      const plan = planFaqRepair(faq.question || '', faq.answer || '');
      if (!plan) continue;
      let dirty = false;
      if (plan.question && plan.question !== faq.question) {
        faq.question = plan.question;
        dirty = true;
      }
      if (plan.answer && plan.answer !== faq.answer) {
        faq.answer = plan.answer;
        dirty = true;
      }
      if (dirty) {
        await faq.save();
        changed += 1;
      }
    }

    if (changed > 0) {
      await cache.delPattern('faqs:*');
      await cache.del(cacheKeys.faqs());
      await cache.del(cacheKeys.faqCategories());
      logger.info(`FAQ policy repair updated ${changed} document(s)`);
    }
  } catch (error) {
    logger.warn('FAQ policy repair skipped:', error instanceof Error ? error.message : error);
  }
}
