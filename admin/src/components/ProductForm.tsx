import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { X, Plus, Trash2, Upload, Link2 } from 'lucide-react';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';

interface ProductFormProps {
  product?: any;
  onClose: () => void;
}

const ProductForm = ({ product, onClose }: ProductFormProps) => {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    brand: product?.brand || '',
    category: product?.category?._id ? String(product.category._id) : (product?.category ? String(product.category) : ''),
    petType: product?.petType || 'dog',
    basePrice: product?.basePrice || '',
    compareAtPrice: product?.compareAtPrice || '',
    tags: product?.tags?.join(', ') || '',
    features: product?.features?.join('\n') || '',
    ingredients: product?.ingredients || '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    autoshipEligible: product?.autoshipEligible ?? false,
    autoshipDiscount: product?.autoshipDiscount || ''
  });

  const [variants, setVariants] = useState(
    product?.variants || [{ size: '', weight: '', price: '', compareAtPrice: '', stock: '', sku: '' }]
  );

  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  
  // Category and Pet Type Management
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCustomPetType, setShowCustomPetType] = useState(false);
  const [customPetType, setCustomPetType] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: adminService.getCategories
  });

  const createCategoryMutation = useMutation({
    mutationFn: adminService.createCategory,
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Ensure _id is a string
      const categoryId = String(newCategory._id || '');
      setFormData({ ...formData, category: categoryId });
      setShowNewCategory(false);
      setNewCategoryName('');
      showToast('Category created successfully!', 'success');
    },
    onError: () => {
      showToast('Failed to create category', 'error');
    }
  });

  const createMutation = useMutation({
    mutationFn: adminService.createProduct,
    onSuccess: () => {
      // Invalidate all product-related queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.refetchQueries({ queryKey: ['products'] });
      showToast('Product created successfully!', 'success');
      onClose();
    },
    onError: (error: any) => {
      console.error('Product creation error:', error);
      console.error('Error response data:', error.response?.data);
      
      // Handle validation errors from express-validator
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map((err: any) => err.message || err.msg)
          .join(', ');
        showToast(`Validation errors: ${validationErrors}`, 'error');
        return;
      }
      
      // Handle Mongoose validation errors
      if (error.response?.data?.error && typeof error.response.data.error === 'object') {
        const mongooseErrors = Object.values(error.response.data.error)
          .map((err: any) => err.message || err)
          .join(', ');
        showToast(`Validation errors: ${mongooseErrors}`, 'error');
        return;
      }
      
      // Handle standard error messages
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to create product. Please check all fields and try again.';
      showToast(errorMessage, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateProduct(product._id, data),
    onSuccess: () => {
      // Invalidate all product-related queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.refetchQueries({ queryKey: ['products'] });
      showToast('Product updated successfully!', 'success');
      onClose();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update product', 'error');
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          console.log('Uploading file:', file.name, file.type, file.size);
          const result = await adminService.uploadImage(file);
          console.log('Upload result (full):', JSON.stringify(result, null, 2));
          
          // Extract URL from response - check multiple possible locations
          let imageUrl = null;
          
          // Try different possible response structures
          if (typeof result === 'string') {
            // If result is already a URL string
            imageUrl = result;
          } else if (result?.url) {
            // Cloudinary URL
            imageUrl = result.url;
          } else if (result?.path) {
            // Local storage path or Cloudinary path
            imageUrl = result.path;
          } else if (result?.secure_url) {
            // Cloudinary secure_url
            imageUrl = result.secure_url;
          } else if (result?.data?.url) {
            // Nested data structure
            imageUrl = result.data.url;
          } else if (result?.data?.path) {
            // Nested data structure with path
            imageUrl = result.data.path;
          }
          
          if (!imageUrl) {
            console.error('No URL found in result. Full result:', JSON.stringify(result, null, 2));
            throw new Error(`No image URL returned from server. Response: ${JSON.stringify(result)}`);
          }
          
          // Ensure URL is a string and is valid
          imageUrl = String(imageUrl).trim();
          
          if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
            throw new Error('Invalid URL returned from server');
          }
          
          console.log('✅ Uploaded image URL:', imageUrl);
          return imageUrl;
        } catch (error: any) {
          console.error('❌ Upload error for file:', file.name, error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          throw error;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      console.log('All uploaded URLs:', uploadedUrls);
      
      // Filter out any invalid URLs
      const validUrls = uploadedUrls.filter(url => url && url.trim() && url !== 'undefined' && url !== 'null');
      
      if (validUrls.length === 0) {
        throw new Error('No valid URLs returned from upload');
      }
      
      // Add URLs to the image list
      const newImageUrls = [...imageUrls, ...validUrls];
      console.log('Setting image URLs. Old:', imageUrls.length, 'New:', newImageUrls.length);
      setImageUrls(newImageUrls);
      
      showToast(`Successfully uploaded ${validUrls.length} image(s)`, 'success');
    } catch (error: any) {
      console.error('Image upload error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to upload images. Please check your Cloudinary configuration and server logs.';
      showToast(errorMessage, 'error');
    } finally {
      setUploading(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_: string, i: number) => i !== index));
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) {
      showToast('Please enter a valid image URL', 'warning');
      return;
    }

    // Basic URL validation - accept any valid URL (Cloudinary, external, etc.)
    const urlPattern = /^(https?:\/\/|data:image\/)/i;
    if (!urlPattern.test(imageUrlInput.trim())) {
      showToast('Please enter a valid URL (must start with http:// or https://)', 'warning');
      return;
    }

    setImageUrls([...imageUrls, imageUrlInput.trim()]);
    setImageUrlInput('');
    setShowUrlInput(false);
    showToast('Image URL added successfully', 'success');
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', weight: '', price: '', compareAtPrice: '', stock: '', sku: '' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_: any, i: number) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      showToast('Please enter a category name', 'warning');
      return;
    }
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      description: `${newCategoryName} products`,
      isActive: true
    });
  };

  const handlePetTypeChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomPetType(true);
      setFormData({ ...formData, petType: customPetType || '' });
    } else {
      setShowCustomPetType(false);
      setFormData({ ...formData, petType: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate images
    if (imageUrls.length === 0) {
      showToast('Please upload at least one product image', 'warning');
      return;
    }

    // Validate category
    if (!formData.category || formData.category.trim() === '') {
      showToast('Please select a category', 'warning');
      return;
    }

    // Validate category is a valid ObjectId format
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(String(formData.category))) {
      showToast('Invalid category selected. Please select a valid category.', 'error');
      return;
    }

    // Validate base price
    const basePrice = parseFloat(String(formData.basePrice));
    if (isNaN(basePrice) || basePrice < 0) {
      showToast('Please enter a valid base price', 'warning');
      return;
    }

    // Validate variants
    const validatedVariants = variants.map((v: any, index: number) => {
      const price = parseFloat(String(v.price));
      const stock = parseInt(String(v.stock), 10);
      
      if (isNaN(price) || price < 0) {
        throw new Error(`Variant ${index + 1}: Please enter a valid price`);
      }
      
      if (isNaN(stock) || stock < 0) {
        throw new Error(`Variant ${index + 1}: Please enter a valid stock quantity`);
      }

      // Generate unique SKU if not provided
      const sku = v.sku && v.sku.trim() 
        ? v.sku.trim() 
        : `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;

      return {
        size: v.size && v.size.trim() ? v.size.trim() : undefined,
        weight: v.weight && v.weight.trim() ? v.weight.trim() : undefined,
        price: price,
        compareAtPrice: v.compareAtPrice ? parseFloat(String(v.compareAtPrice)) : undefined,
        stock: stock,
        sku: sku
      };
    });

    if (validatedVariants.length === 0) {
      showToast('Please add at least one product variant', 'warning');
      return;
    }

    // Build product data
    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      shortDescription: formData.shortDescription?.trim() || undefined,
      brand: formData.brand.trim(),
      category: String(formData.category).trim(), // Ensure it's a string
      petType: formData.petType.trim().toLowerCase(),
      images: imageUrls.map(url => url.trim()).filter(url => url),
      basePrice: basePrice,
      compareAtPrice: formData.compareAtPrice ? parseFloat(String(formData.compareAtPrice)) : undefined,
      tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      features: formData.features ? formData.features.split('\n').map((f: string) => f.trim()).filter((f: string) => f) : [],
      ingredients: formData.ingredients?.trim() || undefined,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      autoshipEligible: formData.autoshipEligible,
      autoshipDiscount: formData.autoshipDiscount ? parseFloat(String(formData.autoshipDiscount)) : undefined,
      variants: validatedVariants
    };

    // Log the data being sent for debugging
    console.log('Submitting product data:', {
      ...productData,
      images: productData.images.length,
      variants: productData.variants.length
    });

    try {
      if (isEditing) {
        updateMutation.mutate(productData);
      } else {
        createMutation.mutate(productData);
      }
    } catch (error: any) {
      console.error('Error submitting product:', error);
      showToast(error.message || 'Failed to submit product', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Premium Dog Food - Chicken & Rice"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Brand *</label>
                <input
                  type="text"
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="PawPremium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Pet Type *</label>
                {!showCustomPetType ? (
                  <select
                    required
                    value={formData.petType}
                    onChange={(e) => handlePetTypeChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={customPetType}
                      onChange={(e) => {
                        setCustomPetType(e.target.value);
                        setFormData({ ...formData, petType: e.target.value });
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter custom pet type (e.g., hamster, rabbit)"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomPetType(false);
                        setCustomPetType('');
                        setFormData({ ...formData, petType: 'dog' });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Category *</label>
                {!showNewCategory ? (
                  <div className="flex gap-2">
                    <select
                      required={!showNewCategory}
                      value={formData.category || ''}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        if (selectedValue === 'new') {
                          setShowNewCategory(true);
                          setFormData({ ...formData, category: '' });
                        } else if (selectedValue) {
                          setFormData({ ...formData, category: selectedValue });
                        }
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a category</option>
                      {categories && categories.length > 0 ? (
                        categories.map((cat: any) => (
                          <option key={cat._id} value={String(cat._id)}>
                            {cat.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Loading categories...</option>
                      )}
                      <option value="new">➕ Add New Category</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter new category name (e.g., Dog Grooming)"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={createCategoryMutation.isPending}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {createCategoryMutation.isPending ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategory(false);
                          setNewCategoryName('');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">Create a new category and it will be automatically selected</p>
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Short Description</label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Premium chicken & rice formula for adult dogs"
                  maxLength={200}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Full Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="High-quality dog food made with real chicken..."
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product Images *</h3>
            
            {/* Add Image Options */}
            <div className="mb-4 flex gap-3">
              {/* Upload Image Option */}
              <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors">
                <Upload size={20} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {uploading ? 'Uploading...' : 'Upload Images'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {/* Add URL Option */}
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 hover:bg-gray-50 transition-colors"
              >
                <Link2 size={20} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {showUrlInput ? 'Cancel' : 'Add Image URL'}
                </span>
              </button>
            </div>

            {/* URL Input Field */}
            {showUrlInput && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Enter image URL (https://example.com/image.jpg or Cloudinary URL)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddImageUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Add URL
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Supports: https:// or http:// URLs (including Cloudinary URLs)
                </p>
              </div>
            )}

            {/* Image Grid */}
            {imageUrls.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {imageUrls.length} {imageUrls.length === 1 ? 'image' : 'images'} added
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square border-2 border-gray-200 rounded-lg overflow-hidden group">
                      <img 
                        src={normalizeImageUrl(url)} 
                        alt={`Product Image ${index + 1}`} 
                        onError={(e) => handleImageError(e, `Product Image ${index + 1}`)}
                        className="w-full h-full object-cover" 
                      />
                      {/* Image Index Badge */}
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                        #{index + 1}
                      </div>
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                      {/* URL Type Indicator */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">
                        {url.startsWith('https://res.cloudinary.com') ? '☁️ Cloudinary' : url.startsWith('http') ? '🌐 External URL' : '🔗 Custom'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {imageUrls.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 mb-2">No images added yet</p>
                <p className="text-xs text-gray-400">Upload images or add image URLs above</p>
              </div>
            )}
          </div>

          {/* Pricing & Variants */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pricing & Variants</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Base Price *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="29.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Compare At Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="39.99"
                />
              </div>
            </div>

              <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Product Variants *</label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <Plus size={16} />
                  Add Variant
                </button>
              </div>
              {variants.map((variant: any, index: number) => (
                <div key={index} className="grid grid-cols-6 gap-2 p-3 border rounded-lg">
                  <input
                    type="text"
                    value={variant.size}
                    onChange={(e) => updateVariant(index, 'size', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="5 lbs"
                  />
                  <input
                    type="text"
                    value={variant.weight}
                    onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="2.3 kg"
                  />
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={variant.price}
                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Price"
                  />
                  <input
                    type="number"
                    required
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Stock"
                  />
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="SKU"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={variants.length === 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="dog food, premium, chicken, grain-free"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Features (one per line)</label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="Real chicken as #1 ingredient&#10;No artificial preservatives&#10;Rich in protein"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ingredients</label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Chicken, Rice, Barley..."
                />
              </div>
            </div>
          </div>

          {/* Autoship */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Autoship Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.autoshipEligible}
                    onChange={(e) => setFormData({ ...formData, autoshipEligible: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Autoship Eligible</span>
                </label>
              </div>
              {formData.autoshipEligible && (
                <div>
                  <label className="block text-sm font-medium mb-2">Autoship Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.autoshipDiscount}
                    onChange={(e) => setFormData({ ...formData, autoshipDiscount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="10"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Featured</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditing
                ? 'Update Product'
                : 'Create Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};

export default ProductForm;

