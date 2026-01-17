# CSV Import Guide - Product Structure & Variants

## Overview
This guide explains how the CSV import template matches the product structure and how variants are handled during import.

## CSV Template Structure

### Required Columns
The demo CSV template includes these **required** columns:
- `name` - Product name (required)
- `description` - Full product description (required)
- `brand` - Brand name (required)
- `category` - Category name or hierarchical path like "Dog > Food > Dry Food" (required)
- `basePrice` - Base price in numbers, e.g., 29.99 (required)
- `petType` - Use: dog, cat, bird, fish, small-pet, reptile (required)
- `images` - Comma-separated URLs, e.g., url1.jpg,url2.jpg (required)

### Optional Columns
- `shortDescription` - Brief product summary
- `compareAtPrice` - Original/compare price
- `tags` - Comma-separated, e.g., premium,organic
- `features` - Comma-separated, e.g., durable,waterproof
- `ingredients` - Product ingredients list
- `isActive` - true or false (default: true)
- `isFeatured` - true or false (default: false)
- `inStock` - true or false (default: true)
- `stock` - Total stock quantity (number)
- `lowStockThreshold` - Low stock alert threshold (number)

### Variant Columns (for CSV)
For products with variants, use these columns:
- `variantSize` - Size for variant (e.g., "5kg", "Small", "10lb")
- `variantPrice` - Price for this variant (overrides basePrice for this variant)
- `variantStock` - Stock for this variant (overrides stock for this variant)
- `variantSku` - SKU for this variant
- `variantCompareAtPrice` - Compare price for this variant (optional)

**Note:** For products **without variants**, leave variant columns empty.

## How Variants Are Added in CSV Import

### Current Implementation

1. **If `variants` column exists and contains JSON:**
   - The system tries to parse it as JSON first
   - Example: `[{"attributes":{"size":"5kg"},"price":29.99,"stock":50,"sku":"SKU-001"}]`
   - This is the most flexible method and supports multiple variants per product

2. **If `variants` column doesn't exist but variant columns are filled:**
   - The system creates a single variant from:
     - `variantSize` → `size` field (legacy support)
     - `variantPrice` → `price` field
     - `variantStock` → `stock` field
     - `variantSku` → `sku` field
     - `variantCompareAtPrice` → `compareAtPrice` field

3. **If no variants specified:**
   - The system creates a default variant with:
     - `size`: empty string
     - `price`: basePrice
     - `stock`: stock (or 0)
     - `sku`: auto-generated from product name

### Variant Structure in Database

The Product model supports two variant formats:

1. **Legacy Format** (for backward compatibility):
```javascript
{
  size: "5kg",  // Direct size field
  price: 29.99,
  stock: 50,
  sku: "SKU-001"
}
```

2. **Modern Format** (flexible attributes):
```javascript
{
  attributes: {
    size: "5kg",
    flavor: "Chicken",
    color: "Red"
    // Can have any key-value pairs
  },
  price: 29.99,
  compareAtPrice: 39.99,
  stock: 50,
  sku: "SKU-001",
  image: "variant-image.jpg",  // Optional
  images: ["img1.jpg", "img2.jpg"]  // Optional
}
```

## CSV Template Example

```csv
name,description,shortDescription,brand,category,basePrice,compareAtPrice,petType,images,tags,features,ingredients,isActive,isFeatured,inStock,stock,variantSize,variantPrice,variantStock,variantSku
Premium Dog Food,High-quality premium dog food with natural ingredients for all dog breeds. Rich in protein and essential nutrients to keep your dog healthy and active.,Premium nutrition for your furry friend,PetBrand,Dog > Food > Dry Food,49.99,59.99,dog,https://example.com/dog-food-1.jpg,premium,healthy,nutrition,Natural chicken brown rice vegetables,true,true,true,100,5kg,49.99,50,DOG-FOOD-5KG-001
```

## Important Notes

### ✅ What Works Correctly

1. **Single Variant Products:**
   - Use `variantSize`, `variantPrice`, `variantStock`, `variantSku` columns
   - Works perfectly for products with one size/variant

2. **Products Without Variants:**
   - Leave variant columns empty
   - System creates a default variant automatically

3. **Category Hierarchy:**
   - Supports simple names: "Dog Food"
   - Supports hierarchical paths: "Dog > Food > Dry Food"
   - Automatically creates missing parent categories

### ⚠️ Current Limitations

1. **Multiple Variants in CSV:**
   - The CSV format only supports **one variant per row**
   - To import products with multiple variants, you have two options:
     a. Use the `variants` column with JSON format (advanced)
     b. Create multiple CSV rows (one per variant) - **NOT RECOMMENDED** as this creates duplicate products

2. **Variant Attributes:**
   - CSV only supports `size` via `variantSize` column
   - For other attributes (flavor, color, etc.), use JSON format in `variants` column

### 📝 Recommendations

1. **For Simple Products (Single Variant):**
   - Use the standard CSV columns: `variantSize`, `variantPrice`, `variantStock`, `variantSku`
   - This is the easiest and most straightforward method

2. **For Complex Products (Multiple Variants or Custom Attributes):**
   - Use JSON import format instead of CSV
   - Or use the `variants` column in CSV with JSON string:
     ```csv
     variants
     [{"attributes":{"size":"5kg","flavor":"Chicken"},"price":29.99,"stock":50,"sku":"SKU-001"},{"attributes":{"size":"10kg","flavor":"Beef"},"price":49.99,"stock":30,"sku":"SKU-002"}]
     ```

3. **Best Practice:**
   - Download the template first to see the exact format
   - Test with a small batch before importing large files
   - Ensure all required fields are filled
   - Use hierarchical category paths for better organization

## Example: Multiple Variants Using JSON in CSV

If you need multiple variants in CSV, use the `variants` column with JSON:

```csv
name,description,brand,category,basePrice,petType,images,variants
Premium Dog Food,High-quality dog food,PetBrand,Dog Food,29.99,dog,https://example.com/dog-food.jpg,"[{""attributes"":{""size"":""5kg"",""flavor"":""Chicken""},""price"":29.99,""stock"":50,""sku"":""DOG-5KG-CHICKEN""},{""attributes"":{""size"":""10kg"",""flavor"":""Chicken""},""price"":49.99,""stock"":30,""sku"":""DOG-10KG-CHICKEN""}]"
```

**Note:** When using JSON in CSV, you need to:
- Escape double quotes by doubling them: `""` instead of `"`
- Keep the JSON on a single line
- Ensure valid JSON syntax

## Summary

✅ **The CSV template DOES match the product structure** for:
- Basic product fields (name, description, brand, etc.)
- Single variant products (using variantSize, variantPrice, etc.)
- Products without variants (default variant created automatically)

⚠️ **For advanced use cases** (multiple variants, custom attributes):
- Use JSON import format (recommended)
- Or use JSON string in CSV `variants` column (advanced)

The system is designed to be flexible and handle both simple and complex product structures!



