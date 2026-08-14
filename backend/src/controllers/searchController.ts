import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import SearchHistory from '../models/SearchHistory';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { executeCachedAggregation } from '../utils/aggregationCache';
import { cache, cacheKeys } from '../utils/cache';
import { extractJsonObject, parseNeuralTwin } from '../utils/neuralScan';
import { mimeFromDataUrl, parseVisualIdentification, visualSearchTerms } from '../utils/visualSearch';
import { buildProductSearchQuery, singleTermNameMatch } from '../utils/productSearchQuery';

const GEMINI_VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

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

    // Prefix/contains match (same as the shop catalog). MongoDB $text is whole-word
    // only, so "pur" / "hill" miss Purina / Hill's on the first letters typed.
    // Empty q lists the active catalog so the Search tab is not blank.
    const searchText = typeof q === 'string' ? q.trim() : '';
    const textQuery = buildProductSearchQuery(
      searchText,
      typeof petType === 'string' ? petType : undefined
    );
    if (textQuery) {
      query = textQuery;
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

    const searchText = q.trim();
    
    // Cache autocomplete results for 1-2 minutes (popular searches)
    const autocompleteCacheKey = `autocomplete:v2:${searchText}:${limit}`;
    let products = await cache.get<any[]>(autocompleteCacheKey);
    
    if (!products) {
      const baseQuery: any = {
        isActive: true,
        $or: [
          { deletedAt: null },
          { deletedAt: { $exists: false } }
        ]
      };
      const regexProductQuery = buildProductSearchQuery(searchText) || {
        ...baseQuery,
        ...singleTermNameMatch(searchText),
      };

      products = [];
      
      try {
        // Short queries ("p", "pur", "hill") must use regex. $text is whole-word
        // only and would return 0 (or a few full-word hits) and skip the fallback.
        if (searchText.length >= 4) {
          const textSearchQuery = {
            ...baseQuery,
            $text: { $search: searchText }
          };
          
          products = await Product.find(textSearchQuery)
            .select('name slug brand images basePrice')
            .limit(limit)
            .lean();
        }
        
        if (products.length === 0) {
          products = await Product.find(regexProductQuery)
            .select('name slug brand images basePrice')
            .limit(limit)
            .lean();
        }
      } catch (error: any) {
        logger.debug(`Text search failed, using regex fallback: ${error.message}`);
        
        products = await Product.find(regexProductQuery)
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

const VISUAL_PRODUCT_FIELDS =
  'name slug brand images variants basePrice compareAtPrice petType inStock averageRating totalReviews isFeatured totalStock category';

async function findVisualProducts(petType: string | null, terms: string[]) {
  const active: any = {
    isActive: true,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  };
  const withPet = petType ? { ...active, petType } : active;
  const seen = new Set<string>();
  const products: any[] = [];

  const pushUnique = (rows: any[]) => {
    for (const row of rows) {
      const id = String(row._id);
      if (!seen.has(id)) {
        seen.add(id);
        products.push(row);
      }
    }
  };

  const searchText = terms.join(' ').trim();
  if (searchText) {
    try {
      const textHits = await Product.find(
        { ...withPet, $text: { $search: searchText } },
        { score: { $meta: 'textScore' } }
      )
        .select(VISUAL_PRODUCT_FIELDS)
        .populate('category', 'name slug petType parentCategory')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .lean();
      pushUnique(textHits);
    } catch {
      // No text index — fall through to regex.
    }
  }

  if (products.length < 5 && terms.length > 0) {
    const orName = terms.map((term) => ({
      name: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    }));
    const extras = await Product.find({
      ...withPet,
      $or: orName,
      ...(products.length ? { _id: { $nin: products.map((p) => p._id) } } : {}),
    })
      .select(VISUAL_PRODUCT_FIELDS)
      .populate('category', 'name slug petType parentCategory')
      .limit(20 - products.length)
      .lean();
    pushUnique(extras);
  }

  if (products.length === 0 && petType && terms.length > 0) {
    return findVisualProducts(null, terms);
  }

  return products.slice(0, 20);
}

// ─── Visual / Photo Search ────────────────────────────────────────────────────
// POST /api/products/visual-search
// Body: { image: "<base64 string>", mimeType: "image/jpeg" }
export const visualSearch = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { image, mimeType } = req.body as { image?: string; mimeType?: string };

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: 'Photo search is warming up. Please try again in a moment.',
      });
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    if (!base64Data || base64Data.length < 100) {
      return res.status(400).json({ success: false, message: 'That photo could not be read. Please try another.' });
    }
    const imageMime = mimeFromDataUrl(image, mimeType || 'image/jpeg');

    const prompt = `You are a pet store product identifier. Look at this image carefully.
If you see a product package, READ the label (brand + product name). If you see an animal, say what supplies it likely needs.
Return ONLY a JSON object (no markdown):
{
  "productType": "<e.g. 'dog food', 'cat litter', 'dog toy', 'bird seed'>",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "petType": "dog" | "cat" | "bird" | "fish" | "reptile" | "small-pet" | "unknown",
  "brand": "<brand if readable, else null>",
  "description": "<1 sentence>"
}
Set productType to "unknown" only if the photo has nothing pet-related.`;

    let identified = null;
    try {
      const geminiRes = await fetch(`${GEMINI_VISION_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: imageMime, data: base64Data } },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        logger.error('Gemini vision error:', errText.slice(0, 500));
        throw new Error(`Gemini error ${geminiRes.status}`);
      }

      const geminiData: any = await geminiRes.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      identified = parseVisualIdentification(extractJsonObject(rawText));
    } catch (err: any) {
      logger.error('Gemini vision call failed:', err.message);
    }

    if (!identified) {
      return res.status(200).json({
        success: true,
        identified: null,
        message: 'Could not identify a pet product in that photo. Try a brighter shot of the front of the package.',
        data: [],
        pagination: { total: 0 },
      });
    }

    let products: any[] = [];
    try {
      products = await findVisualProducts(identified.petType, visualSearchTerms(identified));
    } catch (err: any) {
      logger.error('Visual search catalog query failed:', err.message);
    }

    logger.info(`Visual search: identified "${identified.productType}" (${identified.petType}), found ${products.length} products`);

    return res.status(200).json({
      success: true,
      identified: {
        productType: identified.productType,
        petType: identified.petType,
        brand: identified.brand,
        description: identified.description,
      },
      data: products,
      pagination: { total: products.length, page: 1, limit: 20 },
    });
  } catch (error: any) {
    logger.error('Error in visualSearch:', error);
    return res.status(200).json({
      success: true,
      identified: null,
      message: 'Photo search hit a snag. Please try another photo.',
      data: [],
      pagination: { total: 0 },
    });
  }
};

const NEURAL_PROMPT = `You are Petshiwu Neural, a veterinary-informed computer vision system for a premium pet store.
Look at this image. If a pet is visible, identify it. If only a pet product is visible, say so.
Return ONLY a JSON object (no markdown) in this exact shape:
{
  "subject": "pet" | "product" | "unknown",
  "species": "dog" | "cat" | "bird" | "fish" | "reptile" | "small-pet" | "unknown",
  "breed": "<best breed or mix guess>",
  "breedConfidence": <0-100 integer>,
  "lifeStage": "puppy" | "kitten" | "adult" | "senior" | "unknown",
  "sizeClass": "toy" | "small" | "medium" | "large" | "giant" | "n/a",
  "coat": "short" | "medium" | "long" | "hairless" | "scales" | "feathers" | "unknown",
  "estimatedWeightLbs": <number or null>,
  "traits": ["up to 4 visual traits"],
  "healthWatch": ["up to 4 breed-typical watch-outs, not a diagnosis"],
  "careFocus": ["up to 4 shopping/care priorities"],
  "shopQueries": ["3-4 product search queries for this pet"],
  "summary": "<one sentence, warm and specific>"
}`;

async function findKitProducts(petType: string | null, queries: string[]) {
  const seen = new Set<string>();
  const products: any[] = [];
  const baseQuery: any = { isActive: true, deletedAt: null };
  if (petType) baseQuery.petType = petType;

  for (const query of queries.slice(0, 4)) {
    if (products.length >= 8) break;
    let found: any[] = [];
    try {
      found = await Product.find(
        { ...baseQuery, $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(4)
        .select('name slug brand images basePrice compareAtPrice petType inStock averageRating totalReviews isFeatured totalStock category')
        .populate('category', 'name slug petType')
        .lean();
    } catch {
      found = await Product.find({
        ...baseQuery,
        name: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      })
        .limit(4)
        .select('name slug brand images basePrice compareAtPrice petType inStock averageRating totalReviews isFeatured totalStock category')
        .populate('category', 'name slug petType')
        .lean();
    }

    for (const product of found) {
      const id = String(product._id);
      if (!seen.has(id)) {
        seen.add(id);
        products.push(product);
      }
    }
  }

  return products.slice(0, 8);
}

// POST /api/products/neural-scan
// Body: { image, mimeType }
// Builds a Pet Twin dossier from Gemini Vision and a matched product kit.
export const neuralScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, mimeType } = req.body as { image: string; mimeType: string };
    if (!image) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ success: false, message: 'Neural scan is not configured' });
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const imageMime = mimeType || 'image/jpeg';

    let twin = null;
    try {
      const geminiRes = await fetch(`${GEMINI_VISION_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: NEURAL_PROMPT },
              { inline_data: { mime_type: imageMime, data: base64Data } },
            ],
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        logger.error('Neural scan Gemini error:', errText);
        throw new Error(`Gemini error ${geminiRes.status}`);
      }

      const geminiData: any = await geminiRes.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      twin = parseNeuralTwin(extractJsonObject(rawText));
    } catch (err: any) {
      logger.error('Neural scan vision call failed:', err.message);
    }

    if (!twin || twin.subject === 'unknown') {
      return res.status(200).json({
        success: true,
        twin: null,
        message: 'Could not lock onto a pet in this photo. Try a clearer face-on shot in good light.',
        data: [],
      });
    }

    const kit = await findKitProducts(twin.petType, twin.shopQueries);
    logger.info(`Neural scan: ${twin.species} ${twin.breed} (${twin.breedConfidence}%), ${kit.length} kit items`);

    return res.status(200).json({
      success: true,
      twin,
      data: kit,
    });
  } catch (error: any) {
    logger.error('Error in neuralScan:', error);
    next(error);
  }
};
