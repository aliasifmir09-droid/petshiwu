import { Client } from '@elastic/elasticsearch';
import logger from './logger';

// Elasticsearch client instance
let client: Client | null = null;

/**
 * Initialize Elasticsearch client
 */
export const initElasticsearch = (): Client | null => {
  try {
    const node = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
    const username = process.env.ELASTICSEARCH_USERNAME;
    const password = process.env.ELASTICSEARCH_PASSWORD;
    const cloudId = process.env.ELASTICSEARCH_CLOUD_ID;
    const apiKey = process.env.ELASTICSEARCH_API_KEY;

    // If Elasticsearch is not configured, return null (graceful degradation)
    if (!node && !cloudId) {
      logger.warn('Elasticsearch not configured. Search will use MongoDB.');
      return null;
    }

    const config: any = {};

    if (cloudId) {
      // Elastic Cloud configuration
      config.cloud = { id: cloudId };
      if (apiKey) {
        config.auth = { apiKey };
      } else if (username && password) {
        config.auth = { username, password };
      }
    } else {
      // Self-hosted Elasticsearch
      config.node = node;
      if (username && password) {
        config.auth = { username, password };
      }
    }

    client = new Client(config);

    logger.info('Elasticsearch client initialized');
    return client;
  } catch (error) {
    logger.error('Failed to initialize Elasticsearch:', error);
    return null;
  }
};

/**
 * Get Elasticsearch client instance
 */
export const getElasticsearchClient = (): Client | null => {
  if (!client) {
    client = initElasticsearch();
  }
  return client;
};

/**
 * Check if Elasticsearch is available
 */
export const isElasticsearchAvailable = (): boolean => {
  return client !== null;
};

/**
 * Product index name
 */
export const PRODUCTS_INDEX = 'products';

/**
 * Create products index with mapping
 */
export const createProductsIndex = async (): Promise<boolean> => {
  const esClient = getElasticsearchClient();
  if (!esClient) {
    return false;
  }

  try {
    const indexExists = await esClient.indices.exists({ index: PRODUCTS_INDEX });

    if (indexExists) {
      logger.info(`Elasticsearch index ${PRODUCTS_INDEX} already exists`);
      return true;
    }

    // Define index mapping
    const mapping = {
      mappings: {
        properties: {
          _id: { type: 'keyword' },
          name: {
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' },
              suggest: { type: 'completion' }
            }
          },
          slug: { type: 'keyword' },
          description: {
            type: 'text',
            analyzer: 'standard'
          },
          shortDescription: {
            type: 'text',
            analyzer: 'standard'
          },
          brand: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          category: {
            type: 'object',
            properties: {
              _id: { type: 'keyword' },
              name: { type: 'text' },
              slug: { type: 'keyword' },
              petType: { type: 'keyword' }
            }
          },
          petType: { type: 'keyword' },
          basePrice: { type: 'float' },
          compareAtPrice: { type: 'float' },
          averageRating: { type: 'float' },
          totalReviews: { type: 'integer' },
          isActive: { type: 'boolean' },
          isFeatured: { type: 'boolean' },
          inStock: { type: 'boolean' },
          totalStock: { type: 'integer' },
          images: { type: 'keyword' },
          tags: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          variants: {
            type: 'nested',
            properties: {
              attributes: { type: 'object', enabled: false },
              price: { type: 'float' },
              stock: { type: 'integer' },
              sku: { type: 'keyword' }
            }
          },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' }
        }
      },
      settings: {
        analysis: {
          analyzer: {
            product_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding', 'stop']
            }
          }
        }
      }
    };

    await esClient.indices.create({
      index: PRODUCTS_INDEX,
      body: mapping
    });

    logger.info(`Elasticsearch index ${PRODUCTS_INDEX} created successfully`);
    return true;
  } catch (error: any) {
    logger.error(`Failed to create Elasticsearch index: ${error.message}`);
    return false;
  }
};

/**
 * Delete products index
 */
export const deleteProductsIndex = async (): Promise<boolean> => {
  const esClient = getElasticsearchClient();
  if (!esClient) {
    return false;
  }

  try {
    const indexExists = await esClient.indices.exists({ index: PRODUCTS_INDEX });
    if (indexExists) {
      await esClient.indices.delete({ index: PRODUCTS_INDEX });
      logger.info(`Elasticsearch index ${PRODUCTS_INDEX} deleted`);
    }
    return true;
  } catch (error: any) {
    logger.error(`Failed to delete Elasticsearch index: ${error.message}`);
    return false;
  }
};

/**
 * Index a single product
 */
export const indexProduct = async (product: any): Promise<boolean> => {
  const esClient = getElasticsearchClient();
  if (!esClient) {
    return false;
  }

  try {
    // Transform product for Elasticsearch
    const productDoc = {
      _id: String(product._id),
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      brand: product.brand || '',
      category: product.category ? {
        _id: String(product.category._id || product.category),
        name: product.category.name || '',
        slug: product.category.slug || '',
        petType: product.category.petType || ''
      } : null,
      petType: product.petType || '',
      basePrice: product.basePrice || 0,
      compareAtPrice: product.compareAtPrice || null,
      averageRating: product.averageRating || 0,
      totalReviews: product.totalReviews || 0,
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured || false,
      inStock: product.inStock || false,
      totalStock: product.totalStock || 0,
      images: product.images || [],
      tags: product.tags || [],
      variants: product.variants || [],
      createdAt: product.createdAt || new Date(),
      updatedAt: product.updatedAt || new Date()
    };

    await esClient.index({
      index: PRODUCTS_INDEX,
      id: String(product._id),
      body: productDoc
    });

    return true;
  } catch (error: any) {
    logger.error(`Failed to index product ${product._id}: ${error.message}`);
    return false;
  }
};

/**
 * Remove a product from index
 */
export const removeProductFromIndex = async (productId: string): Promise<boolean> => {
  const esClient = getElasticsearchClient();
  if (!esClient) {
    return false;
  }

  try {
    await esClient.delete({
      index: PRODUCTS_INDEX,
      id: productId
    });
    return true;
  } catch (error: any) {
    // Ignore 404 errors (product already deleted)
    if (error.statusCode !== 404) {
      logger.error(`Failed to remove product ${productId} from index: ${error.message}`);
    }
    return false;
  }
};

/**
 * Bulk index products
 */
export const bulkIndexProducts = async (products: any[]): Promise<boolean> => {
  const esClient = getElasticsearchClient();
  if (!esClient) {
    return false;
  }

  try {
    const body = products.flatMap((product) => {
      const productDoc = {
        _id: String(product._id),
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        brand: product.brand || '',
        category: product.category ? {
          _id: String(product.category._id || product.category),
          name: product.category.name || '',
          slug: product.category.slug || '',
          petType: product.category.petType || ''
        } : null,
        petType: product.petType || '',
        basePrice: product.basePrice || 0,
        compareAtPrice: product.compareAtPrice || null,
        averageRating: product.averageRating || 0,
        totalReviews: product.totalReviews || 0,
        isActive: product.isActive !== false,
        isFeatured: product.isFeatured || false,
        inStock: product.inStock || false,
        totalStock: product.totalStock || 0,
        images: product.images || [],
        tags: product.tags || [],
        variants: product.variants || [],
        createdAt: product.createdAt || new Date(),
        updatedAt: product.updatedAt || new Date()
      };

      return [
        { index: { _index: PRODUCTS_INDEX, _id: String(product._id) } },
        productDoc
      ];
    });

    if (body.length === 0) {
      return true;
    }

    const response = await esClient.bulk({ body, refresh: true });

    if (response.errors) {
      const erroredItems = response.items.filter((item: any) => item.index?.error);
      logger.error(`Bulk index errors: ${erroredItems.length} items failed`);
      erroredItems.forEach((item: any) => {
        logger.error(`Failed to index: ${JSON.stringify(item.index?.error)}`);
      });
    }

    logger.info(`Bulk indexed ${products.length} products`);
    return true;
  } catch (error: any) {
    logger.error(`Failed to bulk index products: ${error.message}`);
    return false;
  }
};

