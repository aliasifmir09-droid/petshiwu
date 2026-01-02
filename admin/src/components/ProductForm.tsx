import { useState, useEffect, useMemo } from 'react';
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

  // Helper function to safely extract ObjectId as string
  const extractObjectIdString = (obj: any): string => {
    if (!obj) return '';
    
    // If it's already a string, return it
    if (typeof obj === 'string') {
      return obj.trim();
    }
    
    // If it's an object, try to extract the ID
    if (typeof obj === 'object' && obj !== null) {
      // Try toString() method (ObjectId has this)
      if (typeof obj.toString === 'function') {
        const idStr = obj.toString().trim();
        // Validate it's a proper ObjectId format (24 hex chars)
        if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
          return idStr;
        }
        // If toString() returns something that's not valid ObjectId, try other methods
        if (idStr !== '[object Object]' && idStr.length > 0) {
          return idStr;
        }
      }
      
      // Try valueOf() method
      if (typeof obj.valueOf === 'function') {
        const value = obj.valueOf();
        if (typeof value === 'string') {
          return value.trim();
        }
      }
      
      // Try accessing common ObjectId properties
      if (obj.$oid) {
        return String(obj.$oid).trim();
      }
      if (obj.hexString) {
        return String(obj.hexString).trim();
      }
      if (obj.str) {
        return String(obj.str).trim();
      }
    }
    
    return '';
  };

  // Helper function to extract category ID from product
  const extractCategoryId = (product: any): string => {
    if (!product?.category) return '';
    
    // Handle string format
    if (typeof product.category === 'string') {
      return product.category.trim();
    }
    
    // Handle object format
    if (typeof product.category === 'object' && product.category !== null) {
      // Most common: populated category object with _id
      if (product.category._id !== undefined && product.category._id !== null) {
        return extractObjectIdString(product.category._id);
      }
      
      // Fallback: try id property
      if (product.category.id !== undefined && product.category.id !== null) {
        return extractObjectIdString(product.category.id);
      }
      
      // Last resort: if the category itself is an ObjectId
      return extractObjectIdString(product.category);
    }
    
    return '';
  };

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    brand: product?.brand || '',
    category: extractCategoryId(product),
    petType: product?.petType || 'dog',
    basePrice: product?.basePrice || '',
    compareAtPrice: product?.compareAtPrice || '',
    tags: product?.tags?.join(', ') || '',
    features: product?.features?.join('\n') || '',
    ingredients: product?.ingredients || '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    lowStockThreshold: product?.lowStockThreshold ?? '',
  });

  const [variants, setVariants] = useState(
    product?.variants || [{ attributes: {}, price: '', compareAtPrice: '', stock: '', sku: '', image: '', images: [] }]
  );

  // Track attribute name edits separately to allow free typing
  const [attributeNameEdits, setAttributeNameEdits] = useState<{ [variantIndex: number]: { [key: string]: string } }>({});

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

  // Fetch pet types from API to sync with side menu
  const { data: petTypesResponse } = useQuery({
    queryKey: ['pet-types'],
    queryFn: adminService.getPetTypes,
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnMount: true, // Always refetch to ensure we get all pet types
  });

  // Sort pet types by order, then by name (same as PetTypes page)
  const sortedPetTypes = useMemo(() => {
    const types = petTypesResponse?.data || [];
    return [...types].sort((a, b) => {
      // First sort by order (handle null/undefined by treating as 0)
      const orderA = a.order !== null && a.order !== undefined ? a.order : 0;
      const orderB = b.order !== null && b.order !== undefined ? b.order : 0;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If order is the same, sort by name
      return a.name.localeCompare(b.name);
    });
  }, [petTypesResponse?.data]);

  // Update formData when product changes (for editing)
  useEffect(() => {
    if (product && isEditing) {
      // Extract category ID using the helper function
      let categoryId = extractCategoryId(product);
      const productPetType = product.petType || 'dog';
      
      // If extraction failed or returned '[object Object]', try direct access
      if (!categoryId || categoryId === '[object Object]') {
        if (product.category && typeof product.category === 'object' && product.category !== null) {
          // Try direct _id access
          if (product.category._id !== undefined && product.category._id !== null) {
            // Check if _id is an ObjectId object (has toString method)
            if (typeof product.category._id === 'object' && typeof product.category._id.toString === 'function') {
              categoryId = product.category._id.toString().trim();
            } else {
              // _id is already a string
              categoryId = String(product.category._id).trim();
            }
          }
        }
      }
      
      // Final validation - reject '[object Object]' and ensure categoryId is a valid ObjectId format
      if (categoryId === '[object Object]' || (categoryId && !/^[0-9a-fA-F]{24}$/.test(categoryId))) {
        // Try one more time with direct extraction
        if (product.category && typeof product.category === 'object' && product.category._id) {
          if (typeof product.category._id.toString === 'function') {
            categoryId = product.category._id.toString().trim();
          } else {
            categoryId = String(product.category._id).trim();
          }
          // If still invalid, clear it
          if (categoryId === '[object Object]' || !/^[0-9a-fA-F]{24}$/.test(categoryId)) {
            categoryId = '';
          }
        } else {
          categoryId = '';
        }
      }
      
      // Always set category from product when editing - no need to preserve previous state
      setFormData(prev => ({
        ...prev,
        name: product.name || prev.name,
        description: product.description || prev.description,
        shortDescription: product.shortDescription || prev.shortDescription,
        brand: product.brand || prev.brand,
        category: categoryId, // Always use product's category
        petType: productPetType,
        basePrice: product.basePrice || prev.basePrice,
        compareAtPrice: product.compareAtPrice || prev.compareAtPrice,
        tags: product.tags?.join(', ') || prev.tags,
        features: product.features?.join('\n') || prev.features,
        ingredients: product.ingredients || prev.ingredients,
        isActive: product.isActive ?? prev.isActive,
      isFeatured: product.isFeatured ?? prev.isFeatured,
      lowStockThreshold: product.lowStockThreshold ?? prev.lowStockThreshold
      }));
      
      if (product.variants) {
        setVariants(product.variants);
      }
      if (product.images) {
        setImageUrls(product.images);
      }
      // Reset attribute name edits when product changes
      setAttributeNameEdits({});
    }
  }, [product, isEditing, categories]); // Add categories to dependencies to re-run when categories load

  const createCategoryMutation = useMutation({
    mutationFn: adminService.createCategory,
    onSuccess: (newCategory) => {
      // Invalidate and refetch all category-related queries
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.refetchQueries({ queryKey: ['categories'] });
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
      // Show success immediately
      showToast('Product created successfully!', 'success');
      onClose();
      
      // Invalidate and refetch in parallel (runs in background)
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['productStats'] }),
        queryClient.invalidateQueries({ queryKey: ['products', 'out-of-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['products', 'out-of-stock-notification'] })
      ]).then(() => {
        // Refetch only active queries in parallel
        Promise.all([
          queryClient.refetchQueries({ queryKey: ['productStats'], type: 'active' }),
          queryClient.refetchQueries({ queryKey: ['products', 'out-of-stock'], type: 'active' })
        ]).catch(err => {
          console.error('Error refetching queries:', err);
        });
      }).catch(err => {
        console.error('Error invalidating queries:', err);
      });
    },
    onError: (error: any) => {
      
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
    onSuccess: (updatedProduct) => {
      // Show success immediately - don't wait for refetches
      showToast('Product updated successfully!', 'success');
      onClose();
      
      // Optimistically update the product in all product list queries
      queryClient.setQueriesData(
        { queryKey: ['products'], exact: false },
        (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          // Update the product in the list if it exists
          const updatedData = oldData.data.map((p: any) => 
            String(p._id) === String(product._id) ? updatedProduct : p
          );
          
          return {
            ...oldData,
            data: updatedData
          };
        }
      );
      
      // Update individual product query
      queryClient.setQueryData(
        ['product', product.slug || product._id],
        updatedProduct
      );
      
      // Invalidate and refetch in parallel (runs in background, doesn't block UI)
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['product', product.slug || product._id] }),
        queryClient.invalidateQueries({ queryKey: ['productStats'] }),
        queryClient.invalidateQueries({ queryKey: ['products', 'out-of-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['products', 'out-of-stock-notification'] })
      ]).then(() => {
        // Refetch only active queries in parallel
        Promise.all([
          queryClient.refetchQueries({ queryKey: ['productStats'], type: 'active' }),
          queryClient.refetchQueries({ queryKey: ['products', 'out-of-stock'], type: 'active' })
        ]).catch(err => {
          console.error('Error refetching queries:', err);
        });
      }).catch(err => {
        console.error('Error invalidating queries:', err);
      });
    },
    onError: (error: any) => {
      // Rollback optimistic updates by invalidating queries
      queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['product', product.slug || product._id] });
      showToast(error.response?.data?.message || 'Failed to update product', 'error');
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Client-side validation before upload
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    
    // Validate each file
    const validationErrors: string[] = [];
    const fileArray = Array.from(files);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        validationErrors.push(`${file.name}: File size (${sizeMB}MB) exceeds maximum allowed size of 100MB`);
        continue;
      }
      
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        const allowedExtensions = ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ') + 
                                 ', ' + ALLOWED_VIDEO_TYPES.map(t => t.split('/')[1]).join(', ');
        validationErrors.push(`${file.name}: File type "${file.type}" is not allowed. Allowed types: ${allowedExtensions}`);
        continue;
      }
      
      // Additional check: validate by extension for cases where MIME type might be incorrect
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'ogg', 'mov', 'avi'];
      if (fileExtension && !allowedExtensions.includes(fileExtension)) {
        validationErrors.push(`${file.name}: File extension ".${fileExtension}" is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
        continue;
      }
    }
    
    // If validation errors exist, show them and stop upload
    if (validationErrors.length > 0) {
      const errorMessage = `Validation failed:\n${validationErrors.join('\n')}`;
      showToast(errorMessage, 'error');
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = fileArray.map(async (file) => {
        try {
          const result = await adminService.uploadImage(file);
          
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
            throw new Error(`No image URL returned from server. Response: ${JSON.stringify(result)}`);
          }
          
          // Ensure URL is a string and is valid
          imageUrl = String(imageUrl).trim();
          
          if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
            throw new Error('Invalid URL returned from server');
          }
          
          return imageUrl;
        } catch (error: any) {
          throw error;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Filter out any invalid URLs
      const validUrls = uploadedUrls.filter(url => url && url.trim() && url !== 'undefined' && url !== 'null');
      
      if (validUrls.length === 0) {
        throw new Error('No valid URLs returned from upload');
      }
      
      // Add URLs to the image list
      const newImageUrls = [...imageUrls, ...validUrls];
      setImageUrls(newImageUrls);
      
      showToast(`Successfully uploaded ${validUrls.length} image(s)`, 'success');
    } catch (error: any) {
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

    // Support multiple URLs separated by commas or newlines
    const urlPattern = /^(https?:\/\/|data:image\/)/i;
    const urls = imageUrlInput
      .split(/[,\n]/)
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      showToast('Please enter at least one valid image URL', 'warning');
      return;
    }

    // Validate all URLs
    const invalidUrls: string[] = [];
    const validUrls: string[] = [];

    urls.forEach(url => {
      if (urlPattern.test(url)) {
        validUrls.push(url);
      } else {
        invalidUrls.push(url);
      }
    });

    if (invalidUrls.length > 0 && validUrls.length === 0) {
      showToast('All URLs are invalid (must start with http:// or https://)', 'warning');
      return;
    }

    if (invalidUrls.length > 0) {
      showToast(`Added ${validUrls.length} valid URL(s). ${invalidUrls.length} invalid URL(s) skipped.`, 'warning');
    } else {
      showToast(`${validUrls.length} image URL(s) added successfully`, 'success');
    }

    // Add valid URLs to the list
    setImageUrls([...imageUrls, ...validUrls]);
    setImageUrlInput('');
    setShowUrlInput(false);
  };

  const addVariant = () => {
    setVariants([...variants, { attributes: {}, price: '', compareAtPrice: '', stock: '', sku: '', image: '', images: [] }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_: any, i: number) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string | string[] | { [key: string]: string }) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  // Helper functions for managing variant attributes
  const updateVariantAttribute = (variantIndex: number, attributeKey: string, attributeValue: string) => {
    const newVariants = [...variants];
    const currentAttributes = newVariants[variantIndex].attributes || {};
    const updatedAttributes = { ...currentAttributes };
    
    if (attributeValue.trim()) {
      updatedAttributes[attributeKey] = attributeValue.trim();
    } else {
      delete updatedAttributes[attributeKey];
    }
    
    newVariants[variantIndex] = { ...newVariants[variantIndex], attributes: updatedAttributes };
    setVariants(newVariants);
  };

  const removeVariantAttribute = (variantIndex: number, attributeKey: string) => {
    const newVariants = [...variants];
    const currentAttributes = newVariants[variantIndex].attributes || {};
    const updatedAttributes = { ...currentAttributes };
    delete updatedAttributes[attributeKey];
    
    newVariants[variantIndex] = { ...newVariants[variantIndex], attributes: updatedAttributes };
    setVariants(newVariants);
  };

  const addVariantAttribute = (variantIndex: number) => {
    const newVariants = [...variants];
    const currentAttributes = newVariants[variantIndex].attributes || {};
    const newKey = `attribute_${Date.now()}`;
    const updatedAttributes = { ...currentAttributes, [newKey]: '' };
    
    newVariants[variantIndex] = { ...newVariants[variantIndex], attributes: updatedAttributes };
    setVariants(newVariants);
  };

  const handleVariantImageUpload = async (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only take first file for variant primary image
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    if (file.size > MAX_FILE_SIZE) {
      showToast(`File size exceeds maximum allowed size of 100MB`, 'error');
      e.target.value = '';
      return;
    }
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast(`File type "${file.type}" is not allowed`, 'error');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const result = await adminService.uploadImage(file);
      
      let imageUrl = null;
      if (typeof result === 'string') {
        imageUrl = result;
      } else if (result?.url) {
        imageUrl = result.url;
      } else if (result?.path) {
        imageUrl = result.path;
      } else if (result?.secure_url) {
        imageUrl = result.secure_url;
      } else if (result?.data?.url) {
        imageUrl = result.data.url;
      } else if (result?.data?.path) {
        imageUrl = result.data.path;
      }
      
      if (!imageUrl) {
        throw new Error('No image URL returned from server');
      }
      
      imageUrl = String(imageUrl).trim();
      updateVariant(variantIndex, 'image', imageUrl);
      showToast('Variant image uploaded successfully', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to upload variant image', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleVariantImageUrl = (variantIndex: number, url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      showToast('Please enter a valid image URL', 'warning');
      return;
    }
    
    // Basic URL validation
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      showToast('Image URL must start with http:// or https://', 'error');
      return;
    }
    
    updateVariant(variantIndex, 'image', trimmedUrl);
    showToast('Variant image URL added', 'success');
  };

  const removeVariantImage = (variantIndex: number) => {
    updateVariant(variantIndex, 'image', '');
    showToast('Variant image removed', 'success');
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      showToast('Please enter a category name', 'warning');
      return;
    }
    if (!formData.petType) {
      showToast('Please select a pet type first', 'warning');
      return;
    }
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      description: `${newCategoryName} products`,
      petType: formData.petType.toLowerCase(),
      isActive: true
    });
  };

  const handlePetTypeChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomPetType(true);
      // Only clear category if pet type actually changed
      const currentPetType = formData.petType;
      setFormData({ ...formData, petType: customPetType || '', category: currentPetType === (customPetType || '') ? formData.category : '' });
    } else {
      setShowCustomPetType(false);
      // Only clear category if pet type actually changed to a different value
      const currentPetType = formData.petType;
      if (currentPetType !== value) {
        // Check if current category belongs to the new pet type
        const currentCategory = categories?.find((cat: any) => cat._id === formData.category);
        if (currentCategory && (currentCategory.petType === value || currentCategory.petType === 'all')) {
          // Keep the category if it's compatible with the new pet type
          setFormData({ ...formData, petType: value });
        } else {
          // Clear category only if it's not compatible
          setFormData({ ...formData, petType: value, category: '' });
        }
      }
    }
  };

  // Filter categories based on selected pet type
  // Always include the current product's category even if it doesn't match the filter
  const currentCategoryId = formData.category ? String(formData.category).trim() : '';
  
  const filteredCategories = categories?.filter((cat: any) => {
    const catId = String(cat._id || '').trim();
    // Always include the current category if editing - match exactly
    if (isEditing && currentCategoryId && catId === currentCategoryId) {
      return true;
    }
    if (!formData.petType) return true; // Show all if no pet type selected
    // Show categories that match the pet type or are for 'all' pets
    return cat.petType === formData.petType.toLowerCase() || cat.petType === 'all';
  }) || [];
  
  // Ensure current category is in the list if editing (add it if it's missing)
  const currentCategory = isEditing && currentCategoryId 
    ? categories?.find((cat: any) => {
        const catId = String(cat._id || '').trim();
        return catId === currentCategoryId;
      })
    : null;
  
  // If current category exists but is not in filtered list, add it at the beginning
  if (currentCategory && !filteredCategories.find((cat: any) => String(cat._id || '').trim() === currentCategoryId)) {
    filteredCategories.unshift(currentCategory);
  }
  
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

      // Process attributes - clean up empty values and convert to proper format
      const attributes: { [key: string]: string } = {};
      if (v.attributes && typeof v.attributes === 'object') {
        Object.entries(v.attributes).forEach(([key, value]) => {
          // Skip temporary keys that start with 'attribute_'
          if (!key.startsWith('attribute_') && value && String(value).trim()) {
            attributes[key.trim()] = String(value).trim();
          }
        });
      }
      
      // Legacy support: migrate size/weight to attributes if they exist
      if (v.size && v.size.trim() && !attributes.size) {
        attributes.size = v.size.trim();
      }
      if (v.weight && v.weight.trim() && !attributes.weight) {
        attributes.weight = v.weight.trim();
      }

      return {
        // Legacy fields (for backward compatibility)
        size: v.size && v.size.trim() ? v.size.trim() : undefined,
        weight: v.weight && v.weight.trim() ? v.weight.trim() : undefined,
        // Flexible attributes
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        price: price,
        compareAtPrice: v.compareAtPrice ? parseFloat(String(v.compareAtPrice)) : undefined,
        stock: stock,
        sku: sku,
        image: v.image && v.image.trim() ? v.image.trim() : undefined,
        images: v.images && Array.isArray(v.images) && v.images.length > 0 
          ? v.images.map((img: string) => img.trim()).filter((img: string) => img)
          : undefined
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
      lowStockThreshold: formData.lowStockThreshold ? parseInt(String(formData.lowStockThreshold), 10) : undefined,
      variants: validatedVariants
    };

    try {
      if (isEditing) {
        updateMutation.mutate(productData);
      } else {
        createMutation.mutate(productData);
      }
    } catch (error: any) {
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
                    <option value="">Select a pet type</option>
                    {sortedPetTypes.map((petType: { _id: string; slug: string; name: string; icon?: string; isActive?: boolean }) => {
                      // Only show active pet types (or all if isActive is undefined for backward compatibility)
                      if (petType.isActive === false) return null;
                      return (
                        <option key={petType._id} value={petType.slug}>
                          {petType.icon ? `${petType.icon} ${petType.name}` : petType.name}
                        </option>
                      );
                    })}
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
                      value={formData.category ? String(formData.category).trim() : ''}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        if (selectedValue === 'new') {
                          setShowNewCategory(true);
                          setFormData({ ...formData, category: '' });
                        } else if (selectedValue) {
                          setFormData({ ...formData, category: selectedValue.trim() });
                        }
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a category</option>
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat: any) => {
                          const catId = String(cat._id || '').trim();
                          return (
                            <option key={cat._id} value={catId}>
                              {cat.name}
                            </option>
                          );
                        })
                      ) : formData.petType ? (
                        <option value="" disabled>
                          No categories available for {formData.petType}. Please select a different pet type or create a new category.
                        </option>
                      ) : (
                        <option value="" disabled>Please select a pet type first</option>
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
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
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
                <div className="flex flex-col gap-2">
                  <textarea
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Enter image URL(s) - one per line or separated by commas&#10;Example:&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-y"
                    rows={3}
                    onKeyDown={(e) => {
                      // Allow Ctrl+Enter or Cmd+Enter to submit
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      Add URL(s)
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Supports: https:// or http:// URLs (including Cloudinary URLs). You can add multiple URLs - one per line or separated by commas.
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
                <p className="text-xs text-gray-400">
                  Upload images or add image URLs above. Max file size: 100MB. Allowed formats: JPEG, PNG, GIF, WebP, SVG, MP4, WebM, OGG, MOV, AVI
                </p>
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
                <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  {/* Variant Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Variant {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={variants.length === 1}
                      title="Remove variant"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Variant Image Section */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">Variant Image (Optional)</label>
                    <div className="flex items-start gap-3">
                      {/* Image Preview */}
                      {variant.image ? (
                        <div className="relative w-20 h-20 border-2 border-gray-300 rounded-lg overflow-hidden flex-shrink-0 group">
                          <img
                            src={normalizeImageUrl(variant.image)}
                            alt={`Variant ${index + 1} image`}
                            onError={(e) => handleImageError(e, `Variant ${index + 1} image`)}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white flex-shrink-0">
                          <span className="text-xs text-gray-400 text-center px-2">No image</span>
                        </div>
                      )}

                      {/* Upload Options */}
                      <div className="flex-1 space-y-2">
                        <label className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg p-2 cursor-pointer hover:border-primary-500 hover:bg-white transition-colors text-xs">
                          <Upload size={14} className="text-gray-600" />
                          <span className="text-xs font-medium text-gray-700">
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                            onChange={(e) => handleVariantImageUpload(index, e)}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                        <input
                          type="text"
                          placeholder="Or paste image URL here"
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              handleVariantImageUrl(index, e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    {!variant.image && (
                      <p className="text-xs text-gray-500 italic">
                        If no variant image is set, the product's main image will be used
                      </p>
                    )}
                  </div>

                  {/* Flexible Attributes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-gray-600">Attributes (Size, Flavor, Color, etc.)</label>
                      <button
                        type="button"
                        onClick={() => addVariantAttribute(index)}
                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus size={12} />
                        Add Attribute
                      </button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(variant.attributes || {}).map(([key, value]) => {
                        // Ensure value is always a string
                        const stringValue = typeof value === 'string' ? value : '';
                        return (
                          <div key={key} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Attribute name (e.g., Size, Flavor)"
                              value={attributeNameEdits[index]?.[key] !== undefined 
                                ? attributeNameEdits[index][key] 
                                : (key.startsWith('attribute_') ? '' : key)}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                
                                // Store the edit value separately (allows free typing)
                                setAttributeNameEdits(prev => ({
                                  ...prev,
                                  [index]: {
                                    ...prev[index],
                                    [key]: newValue
                                  }
                                }));
                              }}
                              onBlur={(e) => {
                                const newKey = e.target.value.trim();
                                const currentAttributes = variant.attributes || {};
                                const oldValue = currentAttributes[key];
                                const valueToKeep = typeof oldValue === 'string' ? oldValue : '';
                                
                                // Clean up edit state
                                setAttributeNameEdits(prev => {
                                  const newEdits = { ...prev };
                                  if (newEdits[index]) {
                                    delete newEdits[index][key];
                                    if (Object.keys(newEdits[index]).length === 0) {
                                      delete newEdits[index];
                                    }
                                  }
                                  return newEdits;
                                });
                                
                                // If empty and it's a temporary attribute, remove it
                                if (!newKey && key.startsWith('attribute_')) {
                                  removeVariantAttribute(index, key);
                                  return;
                                }
                                
                                // If the key changed, rename it
                                if (newKey && newKey !== key) {
                                  const updatedAttributes: { [key: string]: string } = {};
                                  Object.keys(currentAttributes).forEach(k => {
                                    if (k === key) {
                                      updatedAttributes[newKey] = valueToKeep;
                                    } else {
                                      const oldVal = currentAttributes[k];
                                      updatedAttributes[k] = typeof oldVal === 'string' ? oldVal : '';
                                    }
                                  });
                                  updateVariant(index, 'attributes', updatedAttributes);
                                }
                              }}
                              onKeyDown={(e) => {
                                // Prevent Enter from submitting the form
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.currentTarget.blur();
                                }
                              }}
                              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Value (e.g., 5 lb, Chicken)"
                              value={stringValue}
                              onChange={(e) => updateVariantAttribute(index, key, e.target.value)}
                              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariantAttribute(index, key)}
                              className="px-2 text-red-500 hover:text-red-700"
                              title="Remove attribute"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                      {(!variant.attributes || Object.keys(variant.attributes).length === 0) && (
                        <p className="text-xs text-gray-500 italic">
                          No attributes added. Click "Add Attribute" to add size, flavor, color, etc.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price, Stock, SKU */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Price *</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={variant.price || ''}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="29.99"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Stock *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={variant.stock || ''}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">SKU *</label>
                      <input
                        type="text"
                        required
                        value={variant.sku || ''}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="SKU-001"
                      />
                    </div>
                  </div>
                  
                  {/* Compare At Price (Optional) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Compare At Price (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={variant.compareAtPrice || ''}
                      onChange={(e) => updateVariant(index, 'compareAtPrice', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="39.99"
                    />
                  </div>
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

          {/* Inventory Alerts */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Inventory Alerts</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Low Stock Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Leave empty for default (10)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when stock falls below this number. Leave empty to use category/default threshold.
                </p>
              </div>
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

