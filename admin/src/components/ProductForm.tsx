import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

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
    category: product?.category?._id || product?.category || '',
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
      setFormData({ ...formData, category: newCategory._id });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Product created successfully!', 'success');
      onClose();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create product', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateProduct(product._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
        const formData = new FormData();
        formData.append('image', file);
        const result = await adminService.uploadImage(file);
        return result.path;
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      setImageUrls([...imageUrls, ...uploadedPaths]);
    } catch (error) {
      showToast('Failed to upload images', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_: string, i: number) => i !== index));
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

    if (imageUrls.length === 0) {
      showToast('Please upload at least one product image', 'warning');
      return;
    }

    if (!formData.category) {
      showToast('Please select a category', 'warning');
      return;
    }

    const productData = {
      name: formData.name,
      description: formData.description,
      shortDescription: formData.shortDescription,
      brand: formData.brand,
      category: formData.category,
      petType: formData.petType,
      images: imageUrls,
      basePrice: parseFloat(formData.basePrice as any),
      compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice as any) : undefined,
      tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      features: formData.features ? formData.features.split('\n').map((f: string) => f.trim()).filter((f: string) => f) : [],
      ingredients: formData.ingredients || undefined,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      autoshipEligible: formData.autoshipEligible,
      autoshipDiscount: formData.autoshipDiscount ? parseFloat(formData.autoshipDiscount as any) : undefined,
      variants: variants.map((v: any) => ({
        size: v.size || undefined,
        weight: v.weight || undefined,
        price: parseFloat(v.price as any),
        compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice as any) : undefined,
        stock: parseInt(v.stock as any),
        sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    };

    if (isEditing) {
      updateMutation.mutate(productData);
    } else {
      createMutation.mutate(productData);
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
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setShowNewCategory(true);
                          setFormData({ ...formData, category: '' });
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a category</option>
                      {categories?.map((cat: any) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
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
            <div className="mb-4">
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary-500">
                <Upload size={20} />
                <span>{uploading ? 'Uploading...' : 'Click to upload images'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square border rounded-lg overflow-hidden">
                  <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
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

