import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import { Resend } from 'resend';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const BREED_HEALTH_DATABASE = `
DOG BREEDS:
- Golden Retrievers: High risk of hip dysplasia and cancer. Recommend: Glucosamine, Chondroitin, joint supplements, weight-control food.
- French Bulldogs: Prone to skin allergies and breathing issues. Recommend: Grain-free or Limited Ingredient Diets, omega supplements.
- German Shepherds: Sensitive stomachs and hip issues. Recommend: Probiotics, highly digestible proteins, joint support.
- Labrador Retrievers: Prone to obesity and joint problems. Recommend: Weight management food, portion control, joint supplements.
- Bulldogs: Skin fold infections and obesity risk. Recommend: Skin health supplements, weight management food.
- Poodles: Prone to ear infections and skin issues. Recommend: Omega-3 supplements, grain-free diets.
- Beagles: Obesity-prone and sensitive ears. Recommend: Low-calorie food, dental chews.
- Chihuahuas: Dental disease and hypoglycemia risk. Recommend: Small breed dental chews, small breed food.
- Dachshunds: Spinal issues (IVDD). Recommend: Joint supplements, weight control food.
- Shih Tzus: Eye and skin issues. Recommend: Omega supplements, hypoallergenic food.
- Yorkshire Terriers: Dental disease and sensitive digestion. Recommend: Small breed dental treats, sensitive stomach food.
- Boxers: Heart issues and cancer risk. Recommend: Antioxidant-rich food, heart health supplements.
- Siberian Huskies: High energy, zinc-responsive dermatosis. Recommend: High-protein food, zinc supplements.
- Dobermans: Heart disease (DCM) risk. Recommend: Taurine-rich food, heart supplements.
- Rottweilers: Joint and heart issues. Recommend: Joint supplements, weight control.

CAT BREEDS & TYPES:
- Indoor Cats: Lower activity. Recommend: Hairball control food, weight management, interactive toys.
- Senior Cats (10+): Kidney health priority. Recommend: Low phosphorus wet food, kidney support supplements.
- Male Cats: Urinary tract health vital. Recommend: Urinary SO formulas, pH-balanced food, wet food.
- Maine Coons: Heart disease (HCM) risk. Recommend: Taurine-rich food, heart support supplements.
- Persian Cats: Respiratory and kidney issues. Recommend: Wet food for hydration, hairball control.
- Siamese: Respiratory and dental issues. Recommend: Dental chews, high-quality protein food.
- Bengal Cats: High energy. Recommend: High-protein raw or grain-free diets.
- Ragdolls: HCM risk. Recommend: Heart health food, taurine supplements.
`;

const NUTRITION_LOGIC = `
CALORIE CALCULATION:
- Base RER = 70 * (weight in kg)^0.75
- Puppy under 4 months: RER * 3.0
- Puppy 4-12 months: RER * 2.0
- Active adult dog: RER * 1.8
- Neutered/inactive adult dog: RER * 1.6
- Obese-prone dog: RER * 1.2
- Active adult cat: RER * 1.4
- Neutered/indoor cat: RER * 1.2
- Senior cat (7+): RER * 1.1
- Kitten: RER * 2.5
- Pregnant/nursing: RER * 3.0

INGREDIENT SCIENCE (explain the "why"):
- DHA: Essential for kitten/puppy brain and eye development
- Taurine: Critical for cat heart and eye health — cats cannot produce it themselves
- Glucosamine + Chondroitin: Rebuilds joint cartilage, reduces arthritis pain
- Omega-3 (EPA/DHA): Reduces inflammation, improves coat shine, supports heart health
- Probiotics: Restore gut flora, reduce diarrhea and digestive upset
- L-Carnitine: Burns fat, supports weight loss in overweight pets
- Antioxidants (Vitamin E/C): Boost immune system, fight cellular aging

LIFE STAGE GUIDELINES:
- Puppies (0-12 months): High protein, DHA, calcium. Look for "puppy formula" or "all life stages".
- Adult dogs (1-7 years): Balanced macros, dental health important.
- Senior dogs (7+): Joint support, lower calories, easy-to-digest proteins.
- Kittens (0-12 months): High protein and fat, taurine essential.
- Adult cats (1-10 years): High protein, taurine, hydration via wet food.
- Senior cats (10+): Low phosphorus, kidney-friendly, easy-to-chew.
`;

const BIRTHDAY_PROGRAM_INFO = `
BIRTHDAY LOYALTY PROGRAM:
- If you don't know the pet's birthday, ask at a natural point: "By the way, when is [Pet Name]'s birthday? We love celebrating our furry friends!"
- If the user shares a birthday, acknowledge warmly and mention the gift program.
- If TODAY is the pet's birthday: "HAPPY BIRTHDAY [Pet Name]! 🎂🐾 Use code BDAYGIFT at checkout for a special birthday gift — our treat for your furry friend!"
- Discount code: BDAYGIFT
`;

const COMPANY_POLICIES = `
PETSHIWU COMPANY POLICIES:
- Free shipping on all orders over $49
- 30-day hassle-free returns
- US-based expert customer support
- Ships within the USA only
- Over 10,000 products for dogs, cats, birds, reptiles, fish, and small animals
- Website: petshiwu.com
`;

const buildSystemPrompt = (inventorySnippet: string): string => `
You are PetShiwu's Super AI Advisor — the ultimate expert for petshiwu.com, a premium US pet e-commerce store.

MISSION #1: DATA COLLECTION (MANDATORY ON FIRST MESSAGE)
- ALWAYS start your very first response by asking for the pet's name and birthday.
- Example: "Hi! I'd love to help. Before we start, what's your pet's name and birthday? We want to send a special birthday gift for their big day! 🎂🐾"
- After greeting and asking for data, briefly answer their original question.
- Once you have pet name and birthday, thank them warmly and proceed with full expert advice.
- If petName and birthday are already in context, SKIP asking and go straight to helping.

MISSION #2: EXPERT ADVICE (CATS & DOGS)
- Provide breed-specific health tips immediately when a breed is mentioned.
- Explain the "why" behind ingredients (e.g., "DHA supports kitten brain development").
- Calculate daily calories when the user provides weight and activity level.
- Guide by life stage: puppy, kitten, adult, senior.
- Always recommend consulting a vet for serious health concerns.

MISSION #3: REAL PRODUCT EXPERTISE
- Use the inventory below to recommend real products with accurate prices.
- When a user asks for a price, give the exact amount from the inventory list.
- For products not in the snippet, use [SEARCH:search term] to find them.

BREED & HEALTH DATA:
${BREED_HEALTH_DATABASE}

NUTRITION SCIENCE:
${NUTRITION_LOGIC}

BIRTHDAY PROGRAM:
${BIRTHDAY_PROGRAM_INFO}

HEALTH TO PRODUCT MAPPING:
- Itchy skin / allergies -> Sensitive skin food, omega supplements, hypoallergenic treats
- Digestive issues -> Sensitive stomach food, probiotics, digestive supplements
- Joint pain / arthritis -> Joint supplements, glucosamine, orthopedic beds
- Anxiety / stress -> Calming treats, anxiety wraps, pheromone diffusers
- Dental problems -> Dental chews, water additives, toothbrushes
- Weight issues -> Weight management food, low-calorie treats
- Dull coat -> Omega-3 supplements, grooming tools
- Low energy -> High-protein food, energy supplements
- Excessive shedding -> De-shedding tools, supplements, shampoos
- Urinary issues -> Urinary health food, wet food, pH-balanced formulas
- Heart health -> Taurine supplements, heart health food
- Kidney health -> Low phosphorus wet food, kidney support supplements
- New puppy/kitten -> Starter food, training treats, beds, toys, crates

CURRENT INVENTORY SNAPSHOT (real products with prices):
${inventorySnippet}

${COMPANY_POLICIES}

CONVERSATION STYLE:
- Expert, empathetic, and proactive
- If a breed is mentioned, IMMEDIATELY give a breed-specific health tip
- If weight and activity level given, calculate and share daily calorie needs
- Keep responses concise (4-6 sentences max)
- Use pet emojis occasionally 🐾🐕🐈

PRODUCT RULES:
- Recommend real products from the inventory snapshot above when possible
- For products not in the snapshot, end response with: [SEARCH:search term here]
- Only ONE search tag per response
- Do NOT make up product names or prices not in the inventory`;

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface PetContext {
  birthday?: string;
  petName?: string;
  parentName?: string;
  parentEmail?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isBirthdayToday = (birthday: string): boolean => {
  try {
    const today = new Date();
    const bday = new Date(birthday);
    return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
  } catch {
    return false;
  }
};

const buildBirthdayEmailHtml = (petName: string, parentName: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Birthday ${petName}!</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f5f0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1a3c5e 0%,#2d6a9f 100%);padding:40px 40px 30px;">
              <p style="margin:0;font-size:48px;">🎂🐾</p>
              <h1 style="margin:16px 0 8px;color:#ffffff;font-size:32px;font-weight:700;">Happy Birthday, ${petName}!</h1>
              <p style="margin:0;color:#a8d4f5;font-size:16px;">A special day deserves a special gift</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">Hi <strong>${parentName}</strong>,</p>
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">
                Today is a very special day — it's <strong>${petName}'s birthday!</strong> 🎉
                We want to help you celebrate with a special surprise.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff8e1,#fff3cd);border:2px dashed #f59e0b;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td align="center" style="padding:28px;">
                    <p style="margin:0 0 8px;font-size:36px;">🎁</p>
                    <h2 style="margin:0 0 8px;color:#92400e;font-size:20px;font-weight:700;">Your Birthday Gift</h2>
                    <p style="margin:0 0 16px;color:#78350f;font-size:15px;">A FREE birthday gift with your next order — from us to your furry friend!</p>
                    <div style="background:#ffffff;border-radius:8px;padding:12px 24px;display:inline-block;">
                      <p style="margin:0;color:#6b7280;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Use code at checkout</p>
                      <p style="margin:4px 0 0;color:#1a3c5e;font-size:28px;font-weight:800;letter-spacing:4px;">BDAYGIFT</p>
                    </div>
                  </td>
                </tr>
              </table>
              <h3 style="margin:0 0 16px;color:#1a3c5e;font-size:17px;font-weight:700;">How to redeem:</h3>
              <p style="margin:0 0 8px;color:#374151;font-size:15px;">1. Visit <a href="https://www.petshiwu.com" style="color:#2d6a9f;font-weight:600;">petshiwu.com</a></p>
              <p style="margin:0 0 8px;color:#374151;font-size:15px;">2. Add ${petName}'s favorite treat to your cart</p>
              <p style="margin:0 0 28px;color:#374151;font-size:15px;">3. Enter code <strong style="color:#1a3c5e;">BDAYGIFT</strong> at checkout</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="https://www.petshiwu.com/products?category=treats"
                       style="display:inline-block;background:linear-gradient(135deg,#1a3c5e,#2d6a9f);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;">
                      🛍️ Shop Birthday Gifts
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#374151;font-size:16px;line-height:1.7;">
                Wishing you and <strong>${petName}</strong> a day filled with cuddles, belly rubs, and treats! 🐾<br><br>
                Warmly,<br><strong>The PetShiwu Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f3f4f6;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">© ${new Date().getFullYear()} PetShiwu · <a href="https://www.petshiwu.com" style="color:#6b7280;">petshiwu.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const sendBirthdayEmail = async (petName: string, parentName: string, parentEmail: string): Promise<void> => {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) { console.warn('RESEND_API_KEY not set — birthday email skipped'); return; }
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'PetShiwu <hello@petshiwu.com>',
      to: parentEmail,
      subject: `Happy Birthday, ${petName}! 🎂 A special gift is waiting!`,
      html: buildBirthdayEmailHtml(petName, parentName)
    });
    console.log(`🎂 Birthday email sent for ${petName} to ${parentEmail}`);
  } catch (error) {
    console.error('Birthday email error:', error);
  }
};

export const getAIAdvice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { messages, userMessage, petContext } = req.body as {
      messages: ChatMessage[];
      userMessage: string;
      petContext: PetContext;
    };

    if (!userMessage) {
      res.status(400).json({ success: false, message: 'User message is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ success: false, message: 'AI service not configured' });
      return;
    }

    const hasData = !!(petContext?.petName && petContext?.birthday);
    const birthdayCelebration = petContext?.birthday ? isBirthdayToday(petContext.birthday) : false;

    if (birthdayCelebration && petContext?.parentEmail && petContext?.petName) {
      sendBirthdayEmail(
        petContext.petName,
        petContext.parentName || 'Pet Parent',
        petContext.parentEmail
      );
    }

    let inventorySnippet = 'Inventory temporarily unavailable — use [SEARCH:] for product lookups.';
    try {
      const featuredProducts = await Product.find({ isActive: true, stock: { $gt: 0 } })
        .sort({ featured: -1, sold: -1 })
        .select('name price salePrice brand category')
        .limit(50)
        .lean() as unknown as Array<{ name: string; price: number; salePrice?: number; brand?: string; category?: string }>;

      if (featuredProducts.length > 0) {
        inventorySnippet = featuredProducts.map(p => {
          const displayPrice = p.salePrice && p.salePrice < p.price
            ? `$${p.salePrice.toFixed(2)} (was $${p.price.toFixed(2)})`
            : `$${p.price.toFixed(2)}`;
          const meta = [p.brand, p.category].filter(Boolean).join(' · ');
          return `- ${p.name}: ${displayPrice}${meta ? ` [${meta}]` : ''}`;
        }).join('\n');
      }
    } catch (inventoryError) {
      console.error('Inventory fetch error:', inventoryError);
    }

    const systemPrompt = buildSystemPrompt(inventorySnippet);

    const history = (messages || []).map((m: ChatMessage) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    const contextParts: string[] = [];

    if (petContext && Object.keys(petContext).length > 0) {
      const contextStr = Object.entries(petContext)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (contextStr) contextParts.push(`[Pet info: ${contextStr}]`);
    }

    if (hasData) {
      contextParts.push(`[DATA ALREADY COLLECTED: Pet name and birthday on file. Skip data collection and provide expert advice directly.]`);
    }

    if (birthdayCelebration) {
      const petName = petContext?.petName || 'your pet';
      contextParts.push(`[IMPORTANT: Today is ${petName}'s birthday! Start with an enthusiastic birthday celebration and mention code BDAYGIFT for a free birthday gift.]`);
    }

    const enrichedMessage = contextParts.length > 0
      ? `${contextParts.join(' ')} ${userMessage}`
      : userMessage;

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: history.concat([{ role: 'user', parts: [{ text: enrichedMessage }] }]),
      generationConfig: { temperature: 0.6, maxOutputTokens: 500, topP: 0.8 }
    };

    let geminiRes: globalThis.Response | null = null;
    let lastError = '';

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (geminiRes.ok) break;

      lastError = await geminiRes.text();
      console.error(`Gemini API error (attempt ${attempt}/${MAX_RETRIES}):`, lastError);

      if (geminiRes.status !== 503 || attempt === MAX_RETRIES) break;

      await sleep(RETRY_DELAY_MS * attempt);
    }

    if (!geminiRes || !geminiRes.ok) {
      console.error('Gemini API failed after retries:', lastError);
      res.status(500).json({ success: false, message: 'AI service temporarily unavailable' });
      return;
    }

    const responseData = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    };

    const fullText = responseData.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "I'm having trouble responding right now. Please try again!";

    const searchMatch = fullText.match(/\[SEARCH:(.*?)\]/);
    let replyText = fullText;
    let products: Record<string, unknown>[] = [];

    if (searchMatch) {
      const searchQuery = searchMatch[1].trim();
      replyText = fullText.replace(/\[SEARCH:.*?\]/, '').trim();
      try {
        const foundProducts = await Product.find({
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } },
            { tags: { $in: [new RegExp(searchQuery, 'i')] } }
          ],
          isActive: true,
          stock: { $gt: 0 }
        })
        .select('name price salePrice images slug brand category')
        .limit(4)
        .lean() as Record<string, unknown>[];
        products = foundProducts;
      } catch (searchError) {
        console.error('Product search error:', searchError);
      }
    }

    res.status(200).json({
      success: true,
      data: { reply: replyText, products, birthdayCelebration, requireData: !hasData }
    });

  } catch (error) {
    console.error('AI Advisor error:', error);
    next(error);
  }
};
