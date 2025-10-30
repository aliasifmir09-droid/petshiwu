import { Request, Response, NextFunction } from 'express';
import PetType from '../models/PetType';
import { AuthRequest } from '../middleware/auth';

// Get all pet types (public - only active)
export const getPetTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const petTypes = await PetType.find({ isActive: true })
      .sort({ order: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: petTypes.length,
      data: petTypes
    });
  } catch (error) {
    next(error);
  }
};

// Get all pet types for admin (includes inactive)
export const getAllPetTypesAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const petTypes = await PetType.find()
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      total: petTypes.length,
      data: petTypes
    });
  } catch (error) {
    next(error);
  }
};

// Get single pet type by slug
export const getPetType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const petType = await PetType.findOne({ slug: req.params.slug });

    if (!petType) {
      return res.status(404).json({
        success: false,
        message: 'Pet type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: petType
    });
  } catch (error) {
    next(error);
  }
};

// Create new pet type (Admin)
export const createPetType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const petType = await PetType.create(req.body);

    res.status(201).json({
      success: true,
      data: petType
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

    res.status(200).json({
      success: true,
      data: petType
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

    // Update order for each pet type
    const updates = petTypeIds.map((id, index) =>
      PetType.findByIdAndUpdate(id, { order: index })
    );

    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: 'Pet types reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

