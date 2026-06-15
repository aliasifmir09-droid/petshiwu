import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import SearchHistory from '../models/SearchHistory';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { executeCachedAggregation } from '../utils/aggregationCache';
import { cache, cacheKeys } from '../utils/cache';

const GEMINI_VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Advanced search with filters
export const advancedSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      q, // search query
      category,
      petType,
      brand,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sort,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query: any = {
      isActive: true,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };

    // ─── Pet-type keyword detection ─────────────────────────────────────────
    // Maps common search words to their petType DB value.
    // Used so "dog food" → filter petType:"dog" + search "food",
    // rather than trying to match the word "dog" inside product names.
    const PET_TYPE_KEYWORDS: Record<string, string> = {
      dog: 'dog', dogs: 'dog', puppy: 'dog', puppies: 'dog', canine: 'dog',
      cat: 'cat', cats: 'cat', kitten: 'cat', kittens: 'cat', feline: 'cat',
      bird: 'bird', birds: 'bird', parrot: 'bird', parakeet: 'bird', budgie: 'bird',
      fish: 'fish', aquarium: 'fish', aquatic: 'fish',
      reptile: 'reptile', reptiles: 'reptile', lizard: 'reptile', snake: 'reptile', turtle: 'reptile',
      rabbit: 'small-pet', hamster: 'small-pet', bunny: 'small-pet', guinea: 'small-pet', gerbil: 'small-pet',
    };

    // Search query - Use AND logic for better relevance (all terms must be present)
    // Text index exists on: name, description, brand, tags (see Product model)
    if (q && typeof q === 'string') {
      const searchText = q.trim();
      if (searchText.length >= 1) {
        // Split search text into terms
        const searchTerms = searchText.split(/\s+/).filter(term => term.length > 0);
          
        if (searchText.length >= 2) {
          if (searchTerms.length > 1) {
            // ── Step 1: Extract pet type from query terms ──────────────────
            // e.g. "dog food" → detectedPetType="dog", effectiveTerms=["food"]
            // Only auto-detect if petType filter is not already set explicitly
            let detectedPetType: string | null = null;
            let effectiveTerms = [...searchTerms];
            if (!petType) {
              for (let i = 0; i < effectiveTerms.length; i++) {
                const mapped = PET_TYPE_KEYWORDS[effectiveTerms[i].toLowerCase()];
                if (mapped) {
                  detectedPetType = mapped;
                  effectiveTerms.splice(i, 1);
                  break;
                }
              }
            }
            // If all terms were pet-type words (e.g. query = "dog"), keep them all
            if (effectiveTerms.length === 0) effectiveTerms = [...searchTerms];

            // ── Step 2: Build AND conditions ───────────────────────────────
            // Intentionally omit `description` — it causes false positives.
            // E.g. "Automatic Cat Feeder" description may say "suitable for dogs"
            // and "dispenses their food", incorrectly matching "dog food".
            // Matching name, brand, and tags is precise enough.
            const escapedTerms = effectiveTerms.map(term =>
              term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );
            const andConditions = escapedTerms.map(term => ({
              $or: [
                { name: { $regex: term, $options: 'i' } },
                { brand: { $regex: term, $options: 'i' } },
                { tags: { $in: [new RegExp(term, 'i')] } }
              ]
            }));

            // Exact phrase match in name (highest priority)
            const exactNameRegex = new RegExp(
              searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'i'
            );

            // ── Step 3: Compose query ──────────────────────────────────────
            query = {
              isActive: true,
              $and: [
                {
                  $or: [
                    { deletedAt: null },
                    { deletedAt: { $exists: false } }
                  ]
                },
                // Apply detected pet type as a hard filter (most relevant signal)
                ...(detectedPetType ? [{ petType: detectedPetType }] : []),
                {
                  $or: [
                    { name: exactNameRegex },   // exact phrase in name → best match
                    { $and: andConditions }      // all terms in name/brand/tags
                  ]
                }
              ]
            };
          } else {
            // Single term: use text search for better performance
            query.$text = { $search: searchText };
          }
        } else {
          // Single character: regex on name/brand/tags only
          const searchRegex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          query = {
            isActive: true,
            $and: [
              {
                $or: [
                  { deletedAt: null },
                  { deletedAt: { $exists: false } }
                ]
              },
              {
                $or: [
                  { name: searchRegex },
                  { brand: searchRegex },
                  { tags: { $in: [searchRegex] } }
                ]
              }
            ]
          };
        }
      }
    }

    // Category filter
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category as string)) {
        query.category = new mongoose.Types.ObjectId(category as string);
      } else {
        const foundCategory = await Category.findOne({
          $or: [
            { slug: category },
            { name: { $regex: new RegExp(`^${category}$`, 'i') } }
          ],
          isActive: true
        }).lean();
        if (foundCategory) {
          query.category = foundCategory._id;
        }
      }
    }

    // Pet type filter
    if (petType) {
      query.petType = (petType as string).toLowerCase();
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) {
        query.basePrice.$gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        query.basePrice.$lte = parseFloat(maxPrice as string);
      }
    }

    // Rating filter
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating as string) };
    }

    // Stock filter
    const inStockStr = String(inStock || '');
    if (inStockStr.toLowerCase() === 'true') {
      query.inStock = true;
      query.totalStock = { $gt: 0 };
    }

    // Build sort
    let sortOption: any = { createdAt: -1 };
    switch (sort) {
      case 'price-asc':
        sortOption = { basePrice: 1 };
        break;
      case 'price-desc':
        sortOption = { basePrice: -1 };
        break;
      case 'rating':
        sortOption = { averageRating: -1, totalReviews: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'name-asc':
        sortOption = { name: 1 };
        break;
      case 'name-desc':
        sortOption = { name: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Execute query
    // When using $text search, sort by textScore for relevance, then by sortOption
    let productsQuery = Product.find(query) as any;
    
    if (query.$text) {
      // Add text score for relevance ranking
      productsQuery = productsQuery.select({ score: { $meta: 'textScore' } });
      // Sort by text score first (relevance), then by sortOption
      productsQuery = productsQuery.sort({ score: { $meta: 'textScore' }, ...sortOption });
    } else {
      productsQuery = productsQuery.sort(sortOption);
    }
    
    const products = await productsQuery
      .populate('category')
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(query);

    // Get filter options for UI
    // Cache brands list for 5 minutes (doesn't change often)
    const brandsCacheKey = cacheKeys.brands(JSON.stringify(query));
    let brands = await cache.get<string[]>(brandsCacheKey);
    if (!brands) {
      brands = await Product.distinct('brand', { ...query, brand: { $exists: true, $ne: '' } });
      await cache.set(brandsCacheKey, brands, 300); // 5 minutes
    }

    // Cache price range aggregation for 5-10 minutes (depends on query)
    // Price ranges change less frequently than individual products
    const priceRangePipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$basePrice' },
          maxPrice: { $max: '$basePrice' }
        }
      }
    ];
    
    const priceRange = await executeCachedAggregation(
      'products',
      priceRangePipeline,
      async () => {
        return await Product.aggregate(priceRangePipeline);
      },
      600, // 10 minutes cache for price ranges
      JSON.stringify(query) // Include query in cache key suffix
    );

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filters: {
        availableBrands: brands.sort(),
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search autocomplete
export const searchAutocomplete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!q || typeof q !== 'string' || q.trim().length < 1) {
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          categories: []
        }
      });
    }

    // Optimize autocomplete search - use text index if available, fallback to regex
    const searchText = q.trim();
    const searchRegex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    // Cache autocomplete results for 1-2 minutes (popular searches)
    const autocompleteCacheKey = `autocomplete:${searchText}:${limit}`;
    let products = await cache.get<any[]>(autocompleteCacheKey);
    
    if (!products) {
      // Try text search first (faster if index exists)
      const baseQuery: any = {
        isActive: true,
        $or: [
          { deletedAt: null },
          { deletedAt: { $exists: false } }
        ]
      };

      // Initialize products array
      products = [];
      
      try {
        // Try $text search first (requires text index) - only for 2+ characters
        if (searchText.length >= 2) {
          const textSearchQuery = {
            ...baseQuery,
            $text: { $search: searchText }
          };
          
          products = await Product.find(textSearchQuery)
            .select('name slug brand images basePrice')
            .limit(limit)
            .lean();
        }
        
        // If text search returns no results or query is too short, use regex search
        // Regex search works better for single characters and partial matches in descriptions
        if (products.length === 0) {
          const regexSearchQuery = {
            isActive: true,
            $or: [
              { deletedAt: null },
              { deletedAt: { $exists: false } }
            ],
            $and: [
              {
                $or: [
                  { name: searchRegex },
                  { description: searchRegex },
                  { brand: searchRegex },
                  { tags: { $in: [searchRegex] } }
                ]
              }
            ]
          };
          
          products = await Product.find(regexSearchQuery)
            .select('name slug brand images basePrice')
            .limit(limit)
            .lean();
        }
      } catch (error: any) {
        // If $text search fails (e.g., text index doesn't exist), use regex fallback
        logger.debug(`Text search failed, using regex fallback: ${error.message}`);
        
        const regexSearchQuery = {
          isActive: true,
          $or: [
            { deletedAt: null },
            { deletedAt: { $exists: false } }
          ],
          $and: [
            {
              $or: [
                { name: searchRegex },
                { description: searchRegex },
                { brand: searchRegex },
                { tags: { $in: [searchRegex] } }
              ]
            }
          ]
        };
        
        products = await Product.find(regexSearchQuery)
          .select('name slug brand images basePrice')
          .limit(limit)
          .lean();
      }
      
      // Cache popular searches for 2 minutes
      await cache.set(autocompleteCacheKey, products, 120);
    }

    // Search categories - use text search if available, fallback to regex
    const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const categorySearchRegex = new RegExp(escapedText, 'i');
    
    let categories: any[] = [];
    
    try {
      // Try text search first
      const textCategoryQuery = {
        isActive: true,
        $text: { $search: searchText }
      };
      
      categories = await Category.find(textCategoryQuery)
        .select('name slug petType')
        .limit(5)
        .lean();
      
      // If no results, fallback to regex
      if (categories.length === 0) {
        const regexCategoryQuery = {
          isActive: true,
          $or: [
            { name: categorySearchRegex },
            { slug: categorySearchRegex }
          ]
        };
        
        categories = await Category.find(regexCategoryQuery)
          .select('name slug petType')
          .limit(5)
          .lean();
      }
    } catch (error: any) {
      // If text search fails, use regex fallback
      logger.debug(`Category text search failed, using regex fallback: ${error.message}`);
      
      const regexCategoryQuery = {
        isActive: true,
        $or: [
          { name: categorySearchRegex },
          { slug: categorySearchRegex }
        ]
      };
      
      categories = await Category.find(regexCategoryQuery)
        .select('name slug petType')
        .limit(5)
        .lean();
    }

    res.status(200).json({
      success: true,
      data: {
        products: products || [],
        categories: categories || []
      }
    });
  } catch (error: any) {
    logger.error('Error in searchAutocomplete:', error);
    // Return empty results on error instead of failing
    res.status(200).json({
      success: true,
      data: {
        products: [],
        categories: []
      }
    });
  }
};

// ─── Visual / Photo Search ────────────────────────────────────────────────────
// POST /api/products/visual-search
// Body: { image: "<base64 string>", mimeType: "image/jpeg" }
// 1. Sends image to Gemini Vision to identify what product is shown
// 2. Uses the AI description to search the product database
// 3. Returns matching products + the AI-identified label
export const visualSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, mimeType } = req.body as { image: string; mimeType: string };

    if (!image) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ success: false, message: 'Visual search is not configured' });
    }

    // Strip data URL prefix if present (data:image/jpeg;base64,...)
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const imageMime = mimeType || 'image/jpeg';

    // Ask Gemini to identify the pet product in the photo
    const prompt = `You are a pet store product identifier. Look at this image carefully.
Identify any pet product, animal, or pet-related item visible. Be generous — if you see an animal, identify what type of product it might need. If you see a product package, read the label.
Return ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "productType": "<product type, e.g. 'dog food', 'cat collar', 'pet toy', 'dog leash', 'cat litter', 'bird cage', 'fish tank', 'pet bed', 'dog treats', 'cat food'>",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "petType": "<'dog', 'cat', 'bird', 'fish', 'small-animal', or 'unknown'>",
  "brand": "<brand name if visible, or null>",
  "description": "<1 sentence describing what you see>"
}
Only set productType to "unknown" if the image is completely unrelated to pets (e.g. a landscape, car, or human face with no animals/pet products).`;

    const geminiPayload = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: imageMime, data: base64Data } }
        ]
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
    };

    let aiResult: any = null;
    try {
      const geminiRes = await fetch(`${GEMINI_VISION_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
        signal: AbortSignal.timeout(15000)
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        logger.error('Gemini vision error:', errText);
        throw new Error(`Gemini error ${geminiRes.status}`);
      }

      const geminiData: any = await geminiRes.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      }
    } catch (err: any) {
      logger.error('Gemini vision call failed:', err.message);
      // Fall through — we'll return empty results with a helpful message
    }

    if (!aiResult || aiResult.productType === 'unknown') {
      return res.status(200).json({
        success: true,
        identified: null,
        message: 'Could not identify a pet product in the photo. Please try a clearer image.',
        data: [],
        pagination: { total: 0 }
      });
    }

    // Build search terms from AI response
    const searchTerms = [
      aiResult.productType,
      ...(aiResult.keywords || [])
    ].filter(Boolean).join(' ');

    // Build MongoDB query
    const baseQuery: any = {
      isActive: true,
      deletedAt: null,
    };

    if (aiResult.petType && aiResult.petType !== 'unknown') {
      baseQuery.petType = aiResult.petType;
    }
    if (aiResult.brand) {
      // Optional brand match — use regex for fuzzy
      baseQuery.brand = { $regex: new RegExp(aiResult.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
    }

    // Text search for the identified product type
    let products: any[] = [];
    try {
      // Try full-text search first (uses text index)
      products = await Product.find(
        { ...baseQuery, $text: { $search: searchTerms } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .lean();
    } catch {
      // Fallback: regex search on name
    }

    // If text search returns too few results, supplement with regex on name
    if (products.length < 5) {
      const regexTerms = aiResult.productType
        .split(' ')
        .filter((t: string) => t.length > 2)
        .map((t: string) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

      if (regexTerms.length > 0) {
        const extras = await Product.find({
          ...baseQuery,
          name: { $in: regexTerms },
          _id: { $nin: products.map((p: any) => p._id) }
        })
          .limit(20 - products.length)
          .lean();
        products = [...products, ...extras];
      }
    }

    logger.info(`Visual search: identified "${aiResult.productType}" (${aiResult.petType}), found ${products.length} products`);

    return res.status(200).json({
      success: true,
      identified: {
        productType: aiResult.productType,
        petType: aiResult.petType,
        brand: aiResult.brand,
        description: aiResult.description,
      },
      data: products,
      pagination: { total: products.length, page: 1, limit: 20 }
    });

  } catch (error: any) {
    logger.error('Error in visualSearch:', error);
    next(error);
  }
};
