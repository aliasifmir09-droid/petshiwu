import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import { Resend } from 'resend';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const BREED_HEALTH_DATABASE = `
DOG BREEDS:
- Golden Retrievers: High risk of hip dysplasia and cancer. Recommend: Glucosamine, Chondroitin, joint supplements, and weight-control food.
- French Bulldogs: Prone to skin allergies and breathing issues. Recommend: Grain-free or Limited Ingredient Diets, omega supplements.
- German Shepherds: Sensitive stomachs and hip issues. Recommend: Probiotics, highly digestible proteins, joint support.
- Labrador Retrievers: Prone to obesity and joint problems. Recommend: Weight management food, portion control, joint supplements.
- Bulldogs: Skin fold infections and obesity risk. Recommend: Skin health supplements, weight management food.
- Poodles: Prone to ear infections and skin issues. Recommend: Omega-3 supplements, grain-free diets.
- Beagles: Obesity-prone and sensitive ears. Recommend: Low-calorie food, dental chews.
- Chihuahuas: Dental disease and hypoglycemia risk. Recommend: Small breed dental chews, small breed food.
- Dachshunds: Spinal issues (IVDD). Recommend: Joint supplements, weight control food to reduce spine stress.
- Shih Tzus: Eye and skin issues. Recommend: Omega supplements, hypoallergenic food.
- Yorkshire Terriers: Dental disease and sensitive digestion. Recommend: Small breed dental treats, sensitive stomach food.
- Boxers: Heart issues and cancer risk. Recommend: Antioxidant-rich food, heart health supplements.
- Siberian Huskies: High energy, zinc-responsive dermatosis. Recommend: High-protein food, zinc supplements.
- Dobermans: Heart disease (DCM) risk. Recommend: Taurine-rich food, heart supplements.
- Rottweilers: Joint and heart issues. Recommend: Joint supplements, weight control.

CAT BREEDS & TYPES:
- Indoor Cats: Lower activity levels. Recommend: Hairball control food, weight management formulas, interactive toys.
- Senior Cats (10+): Kidney health is priority. Recommend: Low phosphorus wet food, kidney support supplements.
- Male Cats: Urinary tract health vital. Recommend: Urinary SO formulas, pH-balanced food, wet food for hydration.
- Maine Coons: Heart disease (HCM) risk. Recommend: Taurine-rich food, heart support supplements.
- Persian Cats: Respiratory and kidney issues. Recommend: Wet food for hydration, hairball control.
- Siamese: Respiratory and dental issues. Recommend: Dental chews, high-quality protein food.
- Bengal Cats: High energy. Recommend: High-protein raw or grain-free diets.
- Ragdolls: HCM risk like Maine Coons. Recommend: Heart health food, taurine supplements.
`;

const NUTRITION_LOGIC = `
CALORIE CALCULATION:
- Base RER (Resting Energy Requirement) = 70 * (weight in kg)^0.75
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

LIFE STAGE GUIDELINES:
- Puppies (0-12 months): Need DHA for brain development, calcium for bones, high protein.
- Adult dogs (1-7 years): Balanced macros, dental health important, adjust calories to activity.
- Senior dogs (7+ years): Joint support, lower calories, easier to digest proteins.
- Kittens (0-12 months): High protein and fat, taurine essential, DHA for development.
- Adult cats (1-10 years): High protein, taurine, hydration via wet food important.
- Senior cats (10+ years): Kidney-friendly, low phosphorus, easy-to-chew food.
`;

const BIRTHDAY_PROGRAM_INFO = `
BIRTHDAY LOYALTY PROGRAM:
- If you don't know the pet's birthday, politely ask: "By the way, when is [Pet Name]'s birthday? We love celebrating our furry friends!"
- If the user shares a birthday, acknowledge warmly: "We'll make sure [Pet Name] gets a special birthday surprise from PetShiwu!"
- If TODAY is the pet's birthday, celebrate: "HAPPY BIRTHDAY [Pet Name]! 🎂🐾 Use code BDAYGIFT at checkout to get a free treat (under $5) — our gift to your furry friend!"
- Discount code: BDAYGIFT (free treat under $5)
`;

const SYSTEM_PROMPT = `You are PetShiwu's Ultra-Expert AI Pet Advisor and Concierge. You work for petshiwu.com, a premium US pet e-commerce store selling over 10,000 products.

YOUR GOALS:
1. Provide breed-specific health and nutrition advice immediately when a breed is mentioned.
2. Calculate daily calorie needs when the user provides their pet's weight and activity level.
3. Act as a Life-Stage Guide for puppies, kittens, adults, and seniors.
4. Collect pet birthdays and celebrate them with the loyalty program.
5. Recommend relevant products available on PetShiwu.com.

BREED & HEALTH DATABASE:
${BREED_HEALTH_DATABASE}

NUTRITION & CALORIE GUIDELINES:
${NUTRITION_LOGIC}

BIRTHDAY PROGRAM:
${BIRTHDAY_PROGRAM_INFO}

HEALTH TO PRODUCT MAPPING:
- Itchy skin / allergies -> Sensitive skin food, omega supplements, hypoallergenic treats
- Digestive issues / diarrhea -> Sensitive stomach food, probiotics, digestive supplements
- Joint pain / arthritis -> Joint supplements, glucosamine, chondroitin, orthopedic beds
- Anxiety / stress -> Calming treats, anxiety wraps, pheromone diffusers
- Dental problems -> Dental chews, water additives, toothbrushes
- Weight issues -> Weight management food, low-calorie treats
- Dull coat -> Omega-3 supplements, grooming tools, coat-enhancing food
- Low energy -> High-protein food, energy supplements
- Excessive shedding -> De-shedding tools, supplements, specialized shampoos
- Urinary issues -> Urinary health food, wet food, pH-balanced formulas
- Heart health -> Taurine supplements, heart health food
- Kidney health -> Low phosphorus wet food, kidney support supplements
- New puppy/kitten -> Starter food, training treats, beds, toys, crates, pee pads

CONVERSATION STYLE:
- Expert, empathetic, and proactive
- If a user mentions a breed, IMMEDIATELY give a breed-specific health tip
- If a user gives weight and activity level, calculate and share daily calorie needs
- If you don't know the pet's birthday yet, ask at a natural point in the conversation
- Always recommend consulting a vet for serious health concerns
- Keep responses concise (4-6 sentences max)
- Use pet emojis occasionally 🐾🐕🐈

PRODUCT RULES:
- When ready to recommend products, end your response with: [SEARCH:search term here]
- Only include ONE search tag per response
- Search terms should match product categories on PetShiwu.com
- Do NOT make up specific product names or prices`;

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface PetContext {
  [key: string]: string;
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

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1a3c5e 0%,#2d6a9f 100%);padding:40px 40px 30px;">
              <p style="margin:0;font-size:48px;">🎂🐾</p>
              <h1 style="margin:16px 0 8px;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:-0.5px;">
                Happy Birthday, ${petName}!
              </h1>
              <p style="margin:0;color:#a8d4f5;font-size:16px;">A special day deserves a special treat</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">
                Hi <strong>${parentName}</strong>,
              </p>
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">
                Today is a very special day at PetShiwu — it's <strong>${petName}'s birthday!</strong> 🎉
                We know how much joy ${petName} brings to your life, and we want to help you celebrate in style.
              </p>
              <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:1.7;">
                As a birthday gift from the PetShiwu family, we've got a delicious surprise waiting for ${petName}:
              </p>

              <!-- Gift Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff8e1,#fff3cd);border:2px dashed #f59e0b;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td align="center" style="padding:28px;">
                    <p style="margin:0 0 8px;font-size:36px;">🎁</p>
                    <h2 style="margin:0 0 8px;color:#92400e;font-size:20px;font-weight:700;">Your Birthday Gift</h2>
                    <p style="margin:0 0 16px;color:#78350f;font-size:15px;">Get any treat under $5 — FREE with your next order!</p>
                    <div style="background:#ffffff;border-radius:8px;padding:12px 24px;display:inline-block;">
                      <p style="margin:0;color:#6b7280;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Use code at checkout</p>
                      <p style="margin:4px 0 0;color:#1a3c5e;font-size:28px;font-weight:800;letter-spacing:4px;">BDAYGIFT</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <h3 style="margin:0 0 16px;color:#1a3c5e;font-size:17px;font-weight:700;">How to redeem:</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;height:32px;background:#1a3c5e;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:14px;font-weight:700;">1</span>
                        </td>
                        <td style="padding-left:12px;color:#374151;font-size:15px;">Visit <a href="https://www.petshiwu.com" style="color:#2d6a9f;font-weight:600;">petshiwu.com</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;height:32px;background:#1a3c5e;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:14px;font-weight:700;">2</span>
                        </td>
                        <td style="padding-left:12px;color:#374151;font-size:15px;">Add ${petName}'s favorite treat (under $5) to your cart</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;height:32px;background:#1a3c5e;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:14px;font-weight:700;">3</span>
                        </td>
                        <td style="padding-left:12px;color:#374151;font-size:15px;">Enter code <strong style="color:#1a3c5e;">BDAYGIFT</strong> at checkout</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td align="center">
                    <a href="https://www.petshiwu.com/products?maxPrice=5&category=treats"
                       style="display:inline-block;background:linear-gradient(135deg,#1a3c5e,#2d6a9f);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;letter-spacing:0.5px;">
                      🛍️ Shop Birthday Treats Under $5
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;color:#374151;font-size:16px;line-height:1.7;">
                Wishing you and <strong>${petName}</strong> a day filled with extra cuddles, belly rubs, and treats! 🐾
              </p>
              <p style="margin:8px 0 0;color:#374151;font-size:16px;">
                Warmly,<br>
                <strong>The PetShiwu Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">
                © ${new Date().getFullYear()} PetShiwu · <a href="https://www.petshiwu.com" style="color:#6b7280;">petshiwu.com</a>
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                You're receiving this because you registered ${petName}'s birthday with us 🐾
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const sendBirthdayEmail = async (
  petName: string,
  parentName: string,
  parentEmail: string
): Promise<void> => {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set — birthday email not sent');
      return;
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.RESEND_FROM || 'PetShiwu <hello@petshiwu.com>';

    await resend.emails.send({
      from: fromEmail,
      to: parentEmail,
      subject: `Happy Birthday, ${petName}! 🎂 A special treat is waiting for you!`,
      html: buildBirthdayEmailHtml(petName, parentName)
    });

    console.log(`🎂 Birthday email sent for ${petName} to ${parentEmail}`);
  } catch (error) {
    console.error('Birthday email send error:', error);
    // Non-fatal — don't let email failure break the chat response
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

    // Check birthday and send email if today is the day
    const birthdayCelebration = petContext?.birthday ? isBirthdayToday(petContext.birthday) : false;

    if (birthdayCelebration && petContext?.parentEmail && petContext?.petName) {
      const parentName = petContext.parentName || 'Pet Parent';
      sendBirthdayEmail(petContext.petName, parentName, petContext.parentEmail);
    }

    const history = (messages || []).map((m: ChatMessage) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    let enrichedMessage = userMessage;
    const contextParts: string[] = [];

    if (petContext && Object.keys(petContext).length > 0) {
      const contextStr = Object.entries(petContext)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (contextStr) contextParts.push(`[Pet info: ${contextStr}]`);
    }

    if (birthdayCelebration) {
      const petName = petContext?.petName || 'your pet';
      contextParts.push(`[IMPORTANT: Today is ${petName}'s birthday! Start your response with an enthusiastic birthday celebration and mention the BDAYGIFT discount code.]`);
    }

    if (contextParts.length > 0) {
      enrichedMessage = `${contextParts.join(' ')} ${userMessage}`;
    }

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: history.concat([{ role: 'user', parts: [{ text: enrichedMessage }] }]),
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 500,
        topP: 0.8
      }
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
      data: {
        reply: replyText,
        products,
        birthdayCelebration
      }
    });

  } catch (error) {
    console.error('AI Advisor error:', error);
    next(error);
  }
};
