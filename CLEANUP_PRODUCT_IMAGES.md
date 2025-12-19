# 🗑️ Product Images Cleanup Guide

## 📋 Available Commands

### 1. Dry Run (See What Would Be Deleted)
```bash
cd backend
npm run delete-product-images
```
or
```bash
npm run cleanup-images -- --all --dry-run
```

### 2. Delete from Cloudinary Only
```bash
npm run cleanup-images -- --cloudinary
```
- Deletes images from Cloudinary storage
- Keeps image URLs in database

### 3. Remove URLs from Database Only
```bash
npm run cleanup-images -- --database
```
- Removes image URLs from database
- Keeps images in Cloudinary storage

### 4. Delete from Both (Complete Cleanup)
```bash
npm run cleanup-images -- --all
```
- Deletes images from Cloudinary
- Removes URLs from database

### 5. Delete Images for Specific Product
```bash
npm run cleanup-images -- --all --product-id <product-id>
```
Example:
```bash
npm run cleanup-images -- --all --product-id 507f1f77bcf86cd799439011
```

### 6. Delete All Product Images
```bash
npm run cleanup-images -- --all --delete-all-products
```

## ⚠️ Important Notes

1. **Always Use Dry Run First**
   ```bash
   npm run cleanup-images -- --all --dry-run
   ```
   This shows what would be deleted without making any changes.

2. **Cloudinary Configuration Required**
   - For Cloudinary deletion, you need:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
   - Set these in `backend/.env`

3. **What Gets Deleted**
   - Product main images (`product.images[]`)
   - Variant primary images (`variant.image`)
   - Variant image galleries (`variant.images[]`)

4. **What Doesn't Get Deleted**
   - Product data (name, description, price, etc.)
   - Only image URLs/images are removed

## 📊 Storage Optimization

Based on your MongoDB Atlas stats:
- **Products collection**: 8.73 MB storage, 32.51 MB indexes
- **20 products** with images

### To Reduce Storage:

1. **Delete Unused Images**
   ```bash
   npm run cleanup-images -- --all --dry-run
   ```

2. **Clean Up Indexes** (if needed)
   - Large index size (32.51 MB) suggests many indexes
   - Consider reviewing and removing unused indexes
   - Use MongoDB Atlas UI to manage indexes

3. **Optimize Images**
   - Use compressed formats (WebP)
   - Resize images before upload
   - Use Cloudinary transformations

## 🔍 Examples

### Example 1: Check What Would Be Deleted
```bash
cd backend
npm run cleanup-images -- --all --dry-run
```

Output:
```
🔍 DRY RUN MODE - No changes will be made

📦 Found 20 product(s) to process

📦 Processing: Premium Dry Dog Food (507f1f77bcf86cd799439011)
   Found 3 image(s)
   🔍 Would delete from Cloudinary: pet-shop/image/product-1234567890
   🔍 Would delete from Cloudinary: pet-shop/image/product-1234567891
   🔍 Would delete from Cloudinary: pet-shop/image/product-1234567892
   🔍 Would remove images from database

📊 Cleanup Summary:
   Products processed: 20
   Total images processed: 60
   Cloudinary deletions: 60
   Database updates: 20

⚠️  This was a DRY RUN - no changes were made
```

### Example 2: Delete All Images
```bash
npm run cleanup-images -- --all --delete-all-products
```

### Example 3: Delete Specific Product Images
```bash
npm run cleanup-images -- --all --product-id 507f1f77bcf86cd799439011
```

## 🛡️ Safety Features

1. **Dry Run Mode**: Test before deleting
2. **Product ID Filter**: Target specific products
3. **Separate Options**: Choose what to delete (Cloudinary vs Database)
4. **Error Handling**: Continues even if some deletions fail

## 📝 After Cleanup

After deleting images:
1. Products will still exist in database
2. Image fields will be empty arrays/undefined
3. You can re-upload images through admin dashboard
4. Cloudinary storage will be freed up

## ⚡ Quick Reference

| Command | What It Does |
|---------|--------------|
| `npm run delete-product-images` | Dry run - see what would be deleted |
| `npm run cleanup-images -- --cloudinary` | Delete from Cloudinary only |
| `npm run cleanup-images -- --database` | Remove URLs from database only |
| `npm run cleanup-images -- --all` | Delete from both (complete cleanup) |
| `npm run cleanup-images -- --all --product-id <id>` | Delete for specific product |
| `npm run cleanup-images -- --all --delete-all-products` | Delete all product images |

---

**Always use `--dry-run` first to preview changes!** 🛡️

