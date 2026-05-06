import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';

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
- Puppies (0-12 months): Need DHA for brain development, calcium for bones, high protein. Look for "puppy formula" or "all life stages".
- Adult dogs (1-7 years): Balanced macros, dental health important, adjust calories to activity.
- Senior dogs (7+ years): Joint support (glucosamine), lower calories, easier to digest proteins, kidney-friendly.
- Kittens (0-12 months): High protein and fat, taurine essential, DHA for development.
- Adult cats (1-10 years): High protein, taurine, hydration via wet food important.
- Senior cats (10+ years): Kidney-friendly, low phosphorus, easy-to-chew food, joint support.
`;

const SYSTEM_PROMPT = `You are PetShiwu's Ultra-Expert AI Pet Advisor. You work for petshiwu.com, a premium US pet e-commerce store selling over 10,000 products.

YOUR GOALS:
1. Provide breed-specific health and nutrition advice immediately when a breed is mentioned.
2. Calculate daily calorie needs when the user provides their pet's weight and activity level.
3. Act as a Life-Stage Guide for puppies, kittens, adults, and seniors.
4. Recommend relevant products available on PetShiwu.com.

BREED & HEALTH DATABASE:
${BREED_HEALTH_DATABASE}

NUTRITION & CALORIE GUIDELINES:
${NUTRITION_LOGIC}

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
- Ask clarifying questions: pet name, age, breed, weight, health issues
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
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    const history = (messages || []).map((m: ChatMessage) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    let enrichedMessage = userMessage;
    if (petContext && Object.keys(petContext).length > 0) {
      const contextStr = Object.entries(petContext)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (contextStr) {
        enrichedMessage = `[Pet info: ${contextStr}] ${userMessage}`;
      }
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
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
    };

    const fullText = responseData.candidates &&
      responseData.candidates[0] &&
      responseData.candidates[0].content &&
      responseData.candidates[0].content.parts &&
      responseData.candidates[0].content.parts[0] &&
      responseData.candidates[0].content.parts[0].text
        ? responseData.candidates[0].content.parts[0].text
        : "I'm having trouble responding right now. Please try again!";

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
        products: products
      }
    });

  } catch (error) {
    console.error('AI Advisor error:', error);
    next(error);
  }
};
