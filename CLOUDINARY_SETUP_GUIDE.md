# ☁️ Cloudinary Integration Setup Guide

This guide will help you set up Cloudinary for image and video uploads in your pet shop e-commerce platform.

---

## 📋 What is Cloudinary?

Cloudinary is a cloud-based media management service that provides:
- **Image & Video Storage**: Store images and videos in the cloud
- **Automatic Optimization**: Automatic image/video optimization and format conversion
- **CDN Delivery**: Fast global content delivery
- **Transformations**: On-the-fly image/video transformations
- **Free Tier**: 25GB storage, 25GB bandwidth per month

---

## 🚀 Step 1: Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up"** (free account)
3. Fill in your details and verify your email
4. You'll be redirected to your dashboard

---

## 🔑 Step 2: Get Your Cloudinary Credentials

1. In your Cloudinary Dashboard, you'll see your **Account Details**
2. Copy these three values:
   - **Cloud Name** (e.g., `dxyz1234`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

**⚠️ Important**: Keep your API Secret secure! Never commit it to version control.

---

## ⚙️ Step 3: Add Environment Variables

### For Local Development

Add these to your `backend/.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### For Render Deployment

1. Go to your **Backend Service** in Render Dashboard
2. Navigate to **Environment** tab
3. Add these environment variables:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. Click **"Save Changes"**
5. **Redeploy** your backend service

---

## 📦 Step 4: Install Dependencies

The Cloudinary packages are already added to `package.json`. Run:

```bash
cd backend
npm install
```

This will install:
- `cloudinary` - Cloudinary SDK
- `multer-storage-cloudinary` - Multer storage engine for Cloudinary

---

## ✅ Step 5: Verify Setup

### Check if Cloudinary is Configured

The system will automatically:
- Use **Cloudinary** if environment variables are set
- Fall back to **local storage** if Cloudinary is not configured

### Test Upload

1. Log in to your admin dashboard
2. Go to **Products** → **Add Product**
3. Upload an image
4. Check the response - you should see a Cloudinary URL (starts with `https://res.cloudinary.com/`)

---

## 🎯 Features

### Automatic Features

✅ **Image Optimization**: Images are automatically optimized for web
✅ **Format Conversion**: Automatic format conversion (WebP, AVIF when supported)
✅ **Video Support**: Upload and store videos (MP4, WebM, etc.)
✅ **CDN Delivery**: Fast global content delivery
✅ **Organized Storage**: Files are organized in folders (`pet-shop/image/`, `pet-shop/video/`)

### Supported Formats

**Images:**
- JPEG, JPG
- PNG
- GIF
- WebP
- SVG

**Videos:**
- MP4
- WebM
- OGG
- MOV
- AVI

### File Size Limits

- **Maximum file size**: 100MB (for videos)
- **Recommended**: Keep images under 10MB for faster uploads

---

## 🔧 Configuration Options

### Customize Upload Settings

Edit `backend/src/utils/cloudinary.ts` to customize:

```typescript
// Change folder structure
const folder = `pet-shop/${resourceType}`; // Change to your preferred folder

// Add image transformations
transformation: [
  {
    quality: 'auto',
    fetch_format: 'auto',
    width: 1200, // Max width
    height: 1200, // Max height
    crop: 'limit'
  }
]
```

### Image Transformations

Cloudinary supports on-the-fly transformations. You can add transformations to image URLs:

```typescript
// Example: Resize image
const url = cloudinary.url('public-id', {
  width: 500,
  height: 500,
  crop: 'fill',
  quality: 'auto'
});
```

---

## 🗑️ Deleting Files

To delete files from Cloudinary, use the helper function:

```typescript
import { deleteFromCloudinary } from '../utils/cloudinary';

// Delete an image
await deleteFromCloudinary('public-id', 'image');

// Delete a video
await deleteFromCloudinary('public-id', 'video');
```

---

## 🔄 Migration from Local Storage

If you're migrating from local storage:

1. **Existing Images**: Existing images in `/uploads/` will continue to work
2. **New Uploads**: New uploads will go to Cloudinary (if configured)
3. **Gradual Migration**: You can migrate existing images to Cloudinary manually

### Manual Migration Script

Create a script to migrate existing images:

```typescript
// backend/src/utils/migrateToCloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Upload local images to Cloudinary
const uploadLocalImage = async (filePath: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'pet-shop/image',
    resource_type: 'image'
  });
  return result.secure_url;
};
```

---

## 🐛 Troubleshooting

### Upload Fails

**Check:**
1. Environment variables are set correctly
2. API credentials are valid
3. File size is under 100MB
4. File format is supported

### Images Not Displaying

**Check:**
1. Cloudinary URL is correct (starts with `https://res.cloudinary.com/`)
2. Image exists in Cloudinary dashboard
3. CORS settings (Cloudinary handles this automatically)

### Fallback to Local Storage

If Cloudinary is not configured, the system automatically falls back to local storage. Check:
1. Environment variables are set
2. Backend service has been redeployed after adding variables

---

## 📊 Cloudinary Dashboard

Access your Cloudinary Dashboard to:
- View all uploaded images/videos
- Manage media library
- View usage statistics
- Configure settings
- Set up transformations

**Dashboard URL**: https://cloudinary.com/console

---

## 💰 Pricing

### Free Tier (Hobby)
- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **Perfect for**: Small to medium projects

### Paid Plans
- **Advanced**: $99/month - 100GB storage, 100GB bandwidth
- **Enterprise**: Custom pricing

**Note**: Free tier is usually sufficient for most projects. Monitor your usage in the dashboard.

---

## 🔒 Security Best Practices

1. ✅ **Never commit** API Secret to version control
2. ✅ Use **environment variables** for all credentials
3. ✅ **Rotate API keys** periodically
4. ✅ Use **signed uploads** for sensitive content (optional)
5. ✅ Set up **upload presets** with restrictions (optional)

---

## 📚 Additional Resources

- **Cloudinary Documentation**: https://cloudinary.com/documentation
- **Node.js SDK**: https://cloudinary.com/documentation/node_integration
- **Image Transformations**: https://cloudinary.com/documentation/image_transformations
- **Video Transformations**: https://cloudinary.com/documentation/video_transformations

---

## ✅ Checklist

- [ ] Cloudinary account created
- [ ] Credentials copied (Cloud Name, API Key, API Secret)
- [ ] Environment variables added to `.env` (local)
- [ ] Environment variables added to Render (production)
- [ ] Dependencies installed (`npm install`)
- [ ] Backend service redeployed
- [ ] Test upload successful
- [ ] Images displaying correctly

---

**🎉 You're all set!** Your pet shop now uses Cloudinary for image and video uploads!

