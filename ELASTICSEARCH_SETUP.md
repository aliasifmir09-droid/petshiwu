# Elasticsearch Setup Guide

This guide explains how to set up and use Elasticsearch for advanced search functionality in the petshiwu e-commerce platform.

## Overview

Elasticsearch provides:
- **Full-text search** with fuzzy matching and relevance scoring
- **Advanced filtering** with aggregations
- **Fast autocomplete** with completion suggester
- **Better performance** for large product catalogs (10,000+ products)
- **Graceful degradation** - falls back to MongoDB if Elasticsearch is unavailable

## Installation Options

### Option 1: Elastic Cloud (Recommended for Production)

1. Sign up at [Elastic Cloud](https://cloud.elastic.co/)
2. Create a deployment
3. Get your Cloud ID and API Key from the deployment dashboard
4. Add to `.env`:
   ```
   ELASTICSEARCH_CLOUD_ID=your-cloud-id
   ELASTICSEARCH_API_KEY=your-api-key
   ```

### Option 2: Self-Hosted Elasticsearch

1. **Docker (Recommended for Development)**
   ```bash
   docker run -d \
     --name elasticsearch \
     -p 9200:9200 \
     -p 9300:9300 \
     -e "discovery.type=single-node" \
     -e "xpack.security.enabled=false" \
     docker.elastic.co/elasticsearch/elasticsearch:8.11.0
   ```

2. **Local Installation**
   - Download from [Elasticsearch Downloads](https://www.elastic.co/downloads/elasticsearch)
   - Follow installation instructions for your OS
   - Start Elasticsearch service

3. **Add to `.env`**:
   ```
   ELASTICSEARCH_NODE=http://localhost:9200
   # Optional: If security is enabled
   ELASTICSEARCH_USERNAME=elastic
   ELASTICSEARCH_PASSWORD=your-password
   ```

### Option 3: Managed Services

- **AWS Elasticsearch Service**
- **Azure Elasticsearch**
- **Google Cloud Elasticsearch**

Configure using `ELASTICSEARCH_NODE` with your service endpoint.

## Environment Variables

Add these to your `backend/.env` file:

```env
# Elasticsearch Configuration
# Option 1: Elastic Cloud
ELASTICSEARCH_CLOUD_ID=your-cloud-id
ELASTICSEARCH_API_KEY=your-api-key

# Option 2: Self-hosted
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic  # Optional
ELASTICSEARCH_PASSWORD=your-password  # Optional
```

**Note:** If no Elasticsearch configuration is provided, the application will automatically use MongoDB for search (graceful degradation).

## Initial Setup

### 1. Start the Backend Server

The server will automatically:
- Initialize Elasticsearch client
- Create the products index if it doesn't exist
- Log status messages

### 2. Index Existing Products

After starting the server, index all existing products:

**Using API (Admin only):**
```bash
POST /api/elasticsearch/reindex
Authorization: Bearer <admin-token>
```

**Or using curl:**
```bash
curl -X POST http://localhost:5000/api/elasticsearch/reindex \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

This will:
- Create the index if needed
- Index all active products
- Populate category information

### 3. Verify Setup

Check Elasticsearch status:
```bash
GET /api/elasticsearch/status
```

Response:
```json
{
  "success": true,
  "available": true,
  "cluster": {
    "status": "green",
    "numberOfNodes": 1
  },
  "index": {
    "exists": true,
    "name": "products"
  }
}
```

## Automatic Synchronization

Products are automatically synced to Elasticsearch when:
- ✅ Product is created
- ✅ Product is updated
- ✅ Product is deleted (removed from index)
- ✅ Product is deactivated (removed from index)

**Note:** If Elasticsearch is unavailable, product operations continue normally using MongoDB.

## API Endpoints

### Search Endpoints (Public)

- `GET /api/products/search` - Advanced search with filters
- `GET /api/products/search/autocomplete` - Autocomplete suggestions

These endpoints automatically use Elasticsearch if available, otherwise fall back to MongoDB.

### Management Endpoints (Admin Only)

- `GET /api/elasticsearch/status` - Check Elasticsearch status
- `POST /api/elasticsearch/reindex` - Reindex all products
- `POST /api/elasticsearch/reset-index` - Delete and recreate index

## Search Features

### Advanced Search

Supports:
- **Full-text search** with fuzzy matching
- **Filters:** category, pet type, brand, price range, rating, stock status
- **Sorting:** price, rating, newest, name
- **Pagination:** page-based
- **Aggregations:** available brands, price ranges, pet types

### Autocomplete

- **Fast suggestions** as user types
- **Fuzzy matching** for typos
- **Prefix matching** for instant results
- **Product and category suggestions**

## Performance Benefits

| Metric | MongoDB | Elasticsearch |
|--------|---------|---------------|
| **Search Speed** | 200-500ms | 50-150ms |
| **Fuzzy Matching** | Limited | Full support |
| **Relevance Scoring** | Basic | Advanced |
| **Autocomplete** | 100-200ms | 20-50ms |
| **Large Catalogs** | Slower | Optimized |

## Troubleshooting

### Elasticsearch Not Available

If you see: `"Elasticsearch is not configured. Search will use MongoDB."`

**Solutions:**
1. Check environment variables are set correctly
2. Verify Elasticsearch is running: `curl http://localhost:9200`
3. Check network connectivity to Elasticsearch
4. Review server logs for connection errors

### Index Not Created

**Solution:**
```bash
POST /api/elasticsearch/reset-index
# Then
POST /api/elasticsearch/reindex
```

### Products Not Appearing in Search

**Solution:**
1. Check if products are active: `isActive: true`
2. Reindex products: `POST /api/elasticsearch/reindex`
3. Check Elasticsearch status: `GET /api/elasticsearch/status`

### Performance Issues

**Optimizations:**
1. Use Elastic Cloud for production
2. Ensure adequate memory allocation (minimum 2GB)
3. Use SSD storage for Elasticsearch data
4. Monitor cluster health

## Production Recommendations

1. **Use Elastic Cloud** for managed service
2. **Enable security** (username/password or API key)
3. **Set up monitoring** for cluster health
4. **Configure backups** for index data
5. **Use dedicated nodes** for production workloads
6. **Monitor performance** and adjust shard settings

## Migration from MongoDB Search

The application automatically:
- ✅ Detects if Elasticsearch is available
- ✅ Falls back to MongoDB if Elasticsearch is unavailable
- ✅ Syncs products automatically when created/updated
- ✅ No code changes needed in frontend

## Support

For issues or questions:
- Check server logs for Elasticsearch errors
- Verify environment variables
- Test Elasticsearch connection: `curl http://localhost:9200`
- Review Elasticsearch logs

---

**Note:** Elasticsearch is optional. The application works perfectly fine with MongoDB-only search for smaller catalogs (< 5,000 products).

