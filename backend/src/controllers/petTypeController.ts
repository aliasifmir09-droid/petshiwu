import { Request, Response, NextFunction } from 'express';
import PetType from '../models/PetType';
import { AuthRequest } from '../middleware/auth';

// Helper function to normalize pet type _id to string
const normalizePetTypeId = (petType: any): any => {
  if (!petType) return petType;
  
  // Convert to plain object if it's a Mongoose document
  const plainPetType = petType.toObject ? petType.toObject() : petType;
  
  return {
    ...plainPetType,
    _id: plainPetType._id ? String(plainPetType._id) : plainPetType._id
  };
};

// Helper function to normalize array of pet types
const normalizePetTypes = (petTypes: any[]): any[] => {
  return petTypes.map(normalizePetTypeId);
};

// Get all pet types (public - only active)
export const getPetTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const petTypes = await PetType.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();

    // Normalize _id to string for all pet types
    const normalizedPetTypes = normalizePetTypes(petTypes);

    res.status(200).json({
      success: true,
      count: normalizedPetTypes.length,
      data: normalizedPetTypes
    });
  } catch (error) {
    next(error);
  }
};

// Get all pet types for admin (includes inactive)
export const getAllPetTypesAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const petTypes = await PetType.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Normalize _id to string for all pet types
    const normalizedPetTypes = normalizePetTypes(petTypes);

    res.status(200).json({
      success: true,
      total: normalizedPetTypes.length,
      data: normalizedPetTypes
    });
  } catch (error) {
    next(error);
  }
};

// Get single pet type by slug
export const getPetType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const petType = await PetType.findOne({ slug: req.params.slug }).lean();

    if (!petType) {
      return res.status(404).json({
        success: false,
        message: 'Pet type not found'
      });
    }

    // Normalize _id to string
    const normalizedPetType = normalizePetTypeId(petType);

    res.status(200).json({
      success: true,
      data: normalizedPetType
    });
  } catch (error) {
    next(error);
  }
};

// Create new pet type (Admin)
export const createPetType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const petType = await PetType.create(req.body);

    // Normalize _id to string
    const normalizedPetType = normalizePetTypeId(petType);

    res.status(201).json({
      success: true,
      data: normalizedPetType
    });
  } catch (error) {
    next(error);
  }
};

// Update pet type (Admin)
export const updatePetType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const petType = await PetType.findById(req.params.id);

    if (!petType) {
      return res.status(404).json({
        success: false,
        message: 'Pet type not found'
      });
    }

    // Update fields
    Object.assign(petType, req.body);
    
    // Save to trigger pre-save middleware
    await petType.save();

    // Normalize _id to string
    const normalizedPetType = normalizePetTypeId(petType);

    res.status(200).json({
      success: true,
      data: normalizedPetType
    });
  } catch (error) {
    next(error);
  }
};

// Delete pet type (Admin)
export const deletePetType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const petType = await PetType.findByIdAndDelete(req.params.id);

    if (!petType) {
      return res.status(404).json({
        success: false,
        message: 'Pet type not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pet type deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Reorder pet types (Admin)
export const reorderPetTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { petTypeIds } = req.body; // Array of IDs in new order

    if (!Array.isArray(petTypeIds)) {
      return res.status(400).json({
        success: false,
        message: 'petTypeIds must be an array'
      });
    }

    if (petTypeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'petTypeIds array cannot be empty'
      });
    }

    // Validate all IDs exist
    const existingPetTypes = await PetType.find({ _id: { $in: petTypeIds } }).select('_id').lean();
    if (existingPetTypes.length !== petTypeIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some pet type IDs are invalid'
      });
    }

    // PERFORMANCE FIX: Update order for each pet type
    // Each pet type gets a sequential order value (0, 1, 2, 3, ...)
    // This ensures clean ordering without gaps
    const updates = petTypeIds.map((id, index) =>
      PetType.findByIdAndUpdate(
        id, 
        { order: index },
        { new: false, runValidators: true }
      )
    );

    await Promise.all(updates);

    // PERFORMANCE FIX: Clear any pet type caches to ensure frontend sees updated order
    const { cache } = await import('../utils/cache');
    try {
      // Clear pet types cache patterns
      await cache.delPattern('pet-types:*');
      await cache.delPattern('petTypes:*');
    } catch (cacheError: any) {
      // Log but don't fail if cache clearing fails
      const logger = (await import('../utils/logger')).default;
      logger.warn('Failed to clear pet types cache:', cacheError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Pet types reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

