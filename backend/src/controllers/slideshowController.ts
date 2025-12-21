import { Request, Response, NextFunction } from 'express';
import Slideshow, { ISlideshow } from '../models/Slideshow';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { cache, cacheKeys } from '../utils/cache';

// Helper function to normalize slideshow _id to string
const normalizeSlideshowId = (slide: ISlideshow | Record<string, unknown>): any => {
  if (!slide) {
    throw new Error('Slide is required');
  }
  
  const plainSlide = (slide as ISlideshow).toObject 
    ? (slide as ISlideshow).toObject() 
    : slide as Record<string, unknown>;
  
  return {
    _id: plainSlide._id ? String(plainSlide._id) : '',
    id: plainSlide._id ? String(plainSlide._id) : '',
    title: plainSlide.title || '',
    subtitle: plainSlide.subtitle || '',
    description: plainSlide.description || '',
    buttonText: plainSlide.buttonText || '',
    buttonLink: plainSlide.buttonLink || '',
    leftImage: plainSlide.imageUrl || '',
    imageUrl: plainSlide.imageUrl || '',
    backgroundColor: plainSlide.backgroundColor || 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
    theme: plainSlide.theme || 'product',
    isActive: plainSlide.isActive !== false,
    order: typeof plainSlide.order === 'number' ? plainSlide.order : 0,
    createdAt: plainSlide.createdAt ? new Date(plainSlide.createdAt as Date).toISOString() : new Date().toISOString(),
    updatedAt: plainSlide.updatedAt ? new Date(plainSlide.updatedAt as Date).toISOString() : new Date().toISOString()
  };
};

// Helper function to normalize array of slideshows
const normalizeSlideshows = (slides: ISlideshow[]): any[] => {
  return slides.map(normalizeSlideshowId);
};

// Get all active slides (public - for frontend)
export const getActiveSlides = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = cacheKeys.slideshow('active');
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    const slides = await Slideshow.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const normalizedSlides = normalizeSlideshows(slides);
    const response = {
      success: true,
      data: normalizedSlides
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get all slides (admin)
export const getAllSlides = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const slides = await Slideshow.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const normalizedSlides = normalizeSlideshows(slides);

    res.status(200).json({
      success: true,
      data: normalizedSlides
    });
  } catch (error) {
    next(error);
  }
};

// Get single slide by ID (admin)
export const getSlideById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const slide = await Slideshow.findById(id).lean();

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }

    const normalizedSlide = normalizeSlideshowId(slide);

    res.status(200).json({
      success: true,
      data: normalizedSlide
    });
  } catch (error) {
    next(error);
  }
};

// Create new slide (admin)
export const createSlide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      imageUrl,
      backgroundColor,
      theme,
      isActive,
      order
    } = req.body;

    // Validation
    if (!title || !subtitle || !description || !buttonText || !buttonLink || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, subtitle, description, buttonText, buttonLink, and imageUrl are required'
      });
    }

    // Get max order if not provided
    let slideOrder = order;
    if (slideOrder === undefined || slideOrder === null) {
      const maxOrderSlide = await Slideshow.findOne().sort({ order: -1 }).lean();
      slideOrder = maxOrderSlide ? (maxOrderSlide.order || 0) + 1 : 0;
    }

    const slide = new Slideshow({
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      imageUrl,
      backgroundColor: backgroundColor || 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
      theme: theme || 'product',
      isActive: isActive !== undefined ? isActive : true,
      order: slideOrder
    });

    await slide.save();

    // Clear cache
    await cache.del(cacheKeys.slideshow('active'));

    const normalizedSlide = normalizeSlideshowId(slide);

    res.status(201).json({
      success: true,
      message: 'Slide created successfully',
      data: normalizedSlide
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((err: any) => err.message).join(', ')
      });
    }
    next(error);
  }
};

// Update slide (admin)
export const updateSlide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      imageUrl,
      backgroundColor,
      theme,
      isActive,
      order
    } = req.body;

    const slide = await Slideshow.findById(id);

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }

    // Update fields
    if (title !== undefined) slide.title = title;
    if (subtitle !== undefined) slide.subtitle = subtitle;
    if (description !== undefined) slide.description = description;
    if (buttonText !== undefined) slide.buttonText = buttonText;
    if (buttonLink !== undefined) slide.buttonLink = buttonLink;
    if (imageUrl !== undefined) slide.imageUrl = imageUrl;
    if (backgroundColor !== undefined) slide.backgroundColor = backgroundColor;
    if (theme !== undefined) slide.theme = theme;
    if (isActive !== undefined) slide.isActive = isActive;
    if (order !== undefined) slide.order = order;

    await slide.save();

    // Clear cache
    await cache.del(cacheKeys.slideshow('active'));

    const normalizedSlide = normalizeSlideshowId(slide);

    res.status(200).json({
      success: true,
      message: 'Slide updated successfully',
      data: normalizedSlide
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((err: any) => err.message).join(', ')
      });
    }
    next(error);
  }
};

// Delete slide (admin)
export const deleteSlide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const slide = await Slideshow.findByIdAndDelete(id);

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }

    // Clear cache
    await cache.del(cacheKeys.slideshow('active'));

    res.status(200).json({
      success: true,
      message: 'Slide deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Reorder slides (admin)
export const reorderSlides = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { slides } = req.body; // Array of { id, order }

    if (!Array.isArray(slides)) {
      return res.status(400).json({
        success: false,
        message: 'Slides array is required'
      });
    }

    // Update order for each slide
    const updatePromises = slides.map((slide: { id: string; order: number }) =>
      Slideshow.findByIdAndUpdate(slide.id, { order: slide.order }, { new: true })
    );

    await Promise.all(updatePromises);

    // Clear cache
    await cache.del(cacheKeys.slideshow('active'));

    res.status(200).json({
      success: true,
      message: 'Slides reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

