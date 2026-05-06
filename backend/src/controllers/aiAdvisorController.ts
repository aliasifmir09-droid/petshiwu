import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

const SYSTEM_PROMPT = `You are PetShiwu's expert AI Pet Advisor. You work for petshiwu.com, a premium US pet e-commerce store.

EXPERTISE:
- Deep knowledge of pet nutrition, health, and behavior
- Dogs, cats, birds, reptiles, fish, rabbits, hamsters, and other small pets
- Pet health conditions and appropriate product recommendations

HEALTH TO PRODUCT MAPPING:
- Itchy skin / scratching → Sensitive skin food, omega supplements, hypoallergenic treats
- Digestive issues / diarrhea → Sensitive stomach food, probiotics, digestive supplements  
- Joint pain / arthritis → Joint supplements, glucosamine, orthopedic beds
- Anxiety / stress → Calming treats, anxiety wraps, pheromone diffusers
- Dental problems → Dental chews, water additives, toothbrushes
- Weight issues → Weight management food, low-calorie treats
- Dull coat → Omega-3 supplements, grooming tools, coat-enhancing food
- Low energy / lethargy → High-protein food, energy supplements, vet-recommended checkup
- Excessive shedding → De-shedding tools, supplements, specialized shampoos
- New puppy/kitten → Starter food, training treats, beds, toys, crates

CONVERSATION STYLE:
- Warm, empathetic, and expert
- Ask clarifying questions about pet age, breed, and specific issues
- Always recommend consulting a vet for serious health concerns
- Keep responses concise (3-5 sentences max)
- Use pet emojis occasionally 🐾

PRODUCT RULES:
- When ready to recommend products, end your response with: [SEARCH:search term here]
- Only include ONE search per response
- Search terms should match product categories on PetShiwu.com
- Do NOT make up specific product names or prices`;

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export const getAIAdvice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages, userMessage, petContext } = req.body;

    if (!userMessage) {
      return res.status(400).json({ success: false, message: 'User message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'AI service not configured' });
    }

    // Build conversation history
    const history = (messages || []).map((m: ChatMessage) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    // Add pet context to user message if available
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
        temperature: 0.7,
        maxOutputTokens: 400,
        topP: 0.8
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    };

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!geminiRes.ok) {
      const error = await geminiRes.text();
      console.error('Gemini API error:', error);
      return res.status(500).json({ success: false, message: 'AI service temporarily unavailable' });
    }

    const data = await geminiRes.json();
    const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble responding right now. Please try again!";

    // Extract search query if present
    const searchMatch = fullText.match(/\[SEARCH:(.*?)\]/);
    let replyText = fullText;
    let products = [];

    if (searchMatch) {
      const searchQuery = searchMatch[1].trim();
      replyText = fullText.replace(/\[SEARCH:.*?\]/, '').trim();

      // Search products from database
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
        .lean();

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
