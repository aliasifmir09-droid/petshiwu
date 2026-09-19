/**
 * Education guides that live as React routes, not CMS blogs.
 * Googlebot previously 404'd these because /learning/:slug always
 * required a published Blog document.
 */
import { TRENDING_LEARNING_POSTS } from './trendingLearningPosts';

export type StaticLearningPage = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  html: string;
  featuredImage?: string;
  featuredImageWebp?: string;
  imageAlt?: string;
  petType?: string;
  category?: string;
  tags?: string[];
  excerpt?: string;
  shopPath?: string;
};

const CLASSIC_LEARNING_PAGES: Record<string, StaticLearningPage> = {
  'best-dog-food-sensitive-stomach': {
    slug: 'best-dog-food-sensitive-stomach',
    title: 'Best Dog Food for Sensitive Stomachs: A 2026 Expert Guide',
    description:
      "Is your dog struggling with digestive issues? Discover the best dog food for sensitive stomachs, including grain-free and limited ingredient diets at Petshiwu.",
    publishedAt: '2026-01-15T00:00:00.000Z',
    featuredImage: '/blog/kibble-bowl.jpg',
    featuredImageWebp: '/blog/kibble-bowl.webp',
    imageAlt: 'A Labrador eating from a bowl of easily digestible dog food',
    petType: 'dog',
    category: 'Nutrition',
    tags: ['sensitive stomach', 'dog food', 'digestive health', 'limited ingredient'],
    excerpt:
      "Is your dog struggling with digestive issues? Discover the best dog food for sensitive stomachs, including grain-free and limited ingredient diets at Petshiwu.",
    shopPath: '/dog',
    html: `
      <p>Digestive issues can be frustrating for both you and your dog. Whether it is frequent gas, loose stools, or occasional vomiting, finding the <strong>best dog food for a sensitive stomach</strong> is the first step toward a healthier pet.</p>
      <figure>
        <picture>
          <source srcset="/blog/kibble-bowl.webp" type="image/webp" />
          <img src="/blog/kibble-bowl.jpg" alt="A Labrador eating from a bowl of easily digestible dog food" width="1200" height="675" />
        </picture>
      </figure>
      <h2>Signs your dog has a sensitive stomach</h2>
      <p>Before switching foods, look for occasional loose stools or diarrhea, excessive gas, vomiting after eating, a lack of interest in food, or itchy skin and a poor coat, which are often linked to gut health.</p>
      <h2>What to look for on the label</h2>
      <ul>
        <li>High-quality protein such as salmon, lamb, or turkey</li>
        <li>Digestible carbohydrates such as rice, oatmeal, and sweet potato</li>
        <li>Probiotics and prebiotics that support a healthy gut microbiome</li>
        <li>Omega fatty acids that help skin and coat, which are often affected by gut issues</li>
      </ul>
      <h2>Top recommended foods for sensitive digestion</h2>
      <h3>Hill's Science Diet Sensitive Stomach &amp; Skin</h3>
      <p>This is a widely used digestive-health formula. It uses prebiotic fiber to fuel beneficial gut bacteria and is highly digestible for nutrient absorption.</p>
      <h3>Purina Pro Plan Adult Sensitive Skin &amp; Stomach</h3>
      <p>Salmon-first formulas can avoid common allergens like corn, wheat, and soy. Oatmeal is typically gentler on the stomach than corn-heavy recipes.</p>
      <h3>Limited ingredient diets</h3>
      <p>For dogs with suspected food sensitivities, a limited ingredient diet reduces the number of potential triggers by using a single protein source and easily digestible carbs.</p>
      <h2>How to switch food without more upset</h2>
      <p>Transition slowly over 7–10 days. Mix a little more of the new food each day so the gut can adjust. If diarrhea lasts more than 48 hours, or you see blood, repeated vomiting, or dehydration, call your veterinarian.</p>
      <p>Shop sensitive-stomach formulas at Petshiwu. See also our <a href="https://www.petshiwu.com/best-dog-food-sensitive-stomach-diarrhea">sensitive stomach shopping guide</a> and the <a href="/learning/best-limited-ingredient-dog-food">limited ingredient dog food guide</a>.</p>
    `,
  },
  'best-dog-foods-sensitive-stomachs': {
    slug: 'best-dog-foods-sensitive-stomachs',
    title: '10 Best Dog Foods for Sensitive Stomachs [Guide]',
    description:
      'Discover the best dog foods for sensitive stomachs. Expert-reviewed formulas with easily digestible ingredients, probiotics, and limited ingredients.',
    publishedAt: '2024-01-15T00:00:00.000Z',
    featuredImage: '/blog/kibble-bowl.jpg',
    featuredImageWebp: '/blog/kibble-bowl.webp',
    imageAlt: 'Dog food in a bowl for sensitive stomachs',
    petType: 'dog',
    category: 'Nutrition',
    tags: ['sensitive stomach', 'dog food', 'probiotics', 'limited ingredient'],
    excerpt:
      'Discover the best dog foods for sensitive stomachs. Expert-reviewed formulas with easily digestible ingredients, probiotics, and limited ingredients.',
    shopPath: '/dog',
    html: `
      <p>If your dog has diarrhea, vomiting, or frequent stomach upset, the right food can make the difference. This guide explains what to look for and how to transition without more digestive stress.</p>
      <figure>
        <picture>
          <source srcset="/blog/kibble-bowl.webp" type="image/webp" />
          <img src="/blog/kibble-bowl.jpg" alt="Dog food in a bowl for sensitive stomachs" width="1200" height="675" />
        </picture>
      </figure>
      <h2>What makes a dog food good for sensitive stomachs?</h2>
      <ul>
        <li><strong>Limited ingredients:</strong> fewer ingredients mean fewer potential allergens</li>
        <li><strong>Easily digestible proteins:</strong> chicken, turkey, and fish are often gentler than beef</li>
        <li><strong>Probiotics and prebiotics:</strong> support healthy gut bacteria</li>
        <li><strong>No artificial additives:</strong> skip dyes and unnecessary fillers</li>
        <li><strong>Gentle fiber:</strong> pumpkin, sweet potato, and brown rice can aid digestion</li>
      </ul>
      <h2>How to transition your dog</h2>
      <ol>
        <li>Days 1–2: 25% new food with 75% old food</li>
        <li>Days 3–4: 50% new with 50% old</li>
        <li>Days 5–6: 75% new with 25% old</li>
        <li>Day 7+: 100% new food</li>
      </ol>
      <h2>When to consult your veterinarian</h2>
      <ul>
        <li>Persistent diarrhea lasting more than 48 hours</li>
        <li>Blood in stool or vomit</li>
        <li>Severe vomiting or inability to keep food down</li>
        <li>Signs of dehydration such as dry gums or sunken eyes</li>
        <li>Sudden weight loss</li>
      </ul>
      <p>Finding the right food takes patience. Transition slowly and monitor stools, energy, and appetite. Browse options in our <a href="https://www.petshiwu.com/best-dog-food-sensitive-stomach-diarrhea">sensitive stomach collection</a> or read the <a href="https://www.petshiwu.com/learning/best-dog-food-sensitive-stomach">2026 expert guide</a>.</p>
    `,
  },
};

const trendingPages: Record<string, StaticLearningPage> = Object.fromEntries(
  TRENDING_LEARNING_POSTS.map((post) => [post.slug, post])
);

export const STATIC_LEARNING_PAGES: Record<string, StaticLearningPage> = {
  ...CLASSIC_LEARNING_PAGES,
  ...trendingPages,
};

export const isStaticLearningSlug = (slug: string): boolean =>
  Boolean(slug && STATIC_LEARNING_PAGES[slug]);

export const STATIC_LEARNING_PATHS: string[] = Object.keys(STATIC_LEARNING_PAGES).map(
  (slug) => `/learning/${slug}`
);
