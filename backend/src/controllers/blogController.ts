import { Request, Response, NextFunction } from 'express';
import Blog from '../models/Blog';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { cache, cacheKeys } from '../utils/cache';
import mongoose from 'mongoose';

// Helper function to normalize blog _id to string
const normalizeBlogId = (blog: any): any => {
  if (!blog) return blog;
  
  const plainBlog = blog.toObject ? blog.toObject() : blog;
  
  return {
    ...plainBlog,
    _id: plainBlog._id ? String(plainBlog._id) : plainBlog._id,
    author: plainBlog.author && typeof plainBlog.author === 'object' && plainBlog.author._id
      ? {
          ...plainBlog.author,
          _id: String(plainBlog.author._id)
        }
      : plainBlog.author
  };
};

// Helper function to normalize array of blogs
const normalizeBlogs = (blogs: any[]): any[] => {
  return blogs.map(normalizeBlogId);
};

// Get all published blogs (public)
export const getPublishedBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { petType, category, page = 1, limit = 10, search } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { isPublished: true };
    
    if (petType && petType !== 'all') {
      query.petType = petType;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search as string };
    }

    // Cache key
    const cacheKey = cacheKeys.blogs(petType as string, category as string, pageNum, limitNum, search as string) || 
      `blogs:${petType || 'all'}:${category || 'all'}:${pageNum}:${limitNum}:${search || ''}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached.data,
        pagination: cached.pagination
      });
    }

    // Execute query
    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Blog.countDocuments(query);

    const normalizedBlogs = normalizeBlogs(blogs);

    const result = {
      data: normalizedBlogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error fetching published blogs:', error);
    next(error);
  }
};

// Get single blog by slug (public)
export const getBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const cacheKey = `blog:${slug}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      // Increment views (async, don't wait)
      Blog.findByIdAndUpdate(cached._id, { $inc: { views: 1 } }).catch(() => {});
      return res.json({
        success: true,
        data: cached
      });
    }

    const blog = await Blog.findOne({ slug, isPublished: true })
      .populate('author', 'name email')
      .lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment views
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });
    blog.views = (blog.views || 0) + 1;

    const normalizedBlog = normalizeBlogId(blog);

    // Cache for 10 minutes
    await cache.set(cacheKey, normalizedBlog, 600);

    res.json({
      success: true,
      data: normalizedBlog
    });
  } catch (error: any) {
    logger.error('Error fetching blog:', error);
    next(error);
  }
};

// Get all blogs for admin (includes unpublished)
export const getAllBlogsAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { petType, category, page = 1, limit = 20, search, isPublished } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (petType && petType !== 'all') {
      query.petType = petType;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search as string, $options: 'i' } },
        { content: { $regex: search as string, $options: 'i' } },
        { excerpt: { $regex: search as string, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Blog.countDocuments(query);

    const normalizedBlogs = normalizeBlogs(blogs);

    res.json({
      success: true,
      data: normalizedBlogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    logger.error('Error fetching blogs (admin):', error);
    next(error);
  }
};

// Get single blog by ID (admin)
export const getBlogById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID'
      });
    }

    const blog = await Blog.findById(id)
      .populate('author', 'name email')
      .lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const normalizedBlog = normalizeBlogId(blog);

    res.json({
      success: true,
      data: normalizedBlog
    });
  } catch (error: any) {
    logger.error('Error fetching blog:', error);
    next(error);
  }
};

// Create new blog (admin)
export const createBlog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content, excerpt, featuredImage, petType, category, tags, isPublished, metaTitle, metaDescription } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and category are required'
      });
    }

    const blog = new Blog({
      title,
      content,
      excerpt,
      featuredImage,
      petType: petType || 'all',
      category,
      author: req.user!._id,
      tags: tags || [],
      isPublished: isPublished || false,
      metaTitle,
      metaDescription
    });

    await blog.save();
    await blog.populate('author', 'name email');

    // Clear blog caches
    await clearBlogCaches();

    const normalizedBlog = normalizeBlogId(blog);

    res.status(201).json({
      success: true,
      data: normalizedBlog,
      message: 'Blog created successfully'
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A blog with this title already exists'
      });
    }
    logger.error('Error creating blog:', error);
    next(error);
  }
};

// Update blog (admin)
export const updateBlog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, featuredImage, petType, category, tags, isPublished, metaTitle, metaDescription } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID'
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Update fields
    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (featuredImage !== undefined) blog.featuredImage = featuredImage;
    if (petType !== undefined) blog.petType = petType;
    if (category !== undefined) blog.category = category;
    if (tags !== undefined) blog.tags = tags;
    if (isPublished !== undefined) {
      blog.isPublished = isPublished;
      if (isPublished && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }
    }
    if (metaTitle !== undefined) blog.metaTitle = metaTitle;
    if (metaDescription !== undefined) blog.metaDescription = metaDescription;

    await blog.save();
    await blog.populate('author', 'name email');

    // Clear blog caches
    await clearBlogCaches();
    await cache.del(`blog:${blog.slug}`);

    const normalizedBlog = normalizeBlogId(blog);

    res.json({
      success: true,
      data: normalizedBlog,
      message: 'Blog updated successfully'
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A blog with this title already exists'
      });
    }
    logger.error('Error updating blog:', error);
    next(error);
  }
};

// Delete blog (admin)
export const deleteBlog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID'
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const slug = blog.slug;
    await Blog.findByIdAndDelete(id);

    // Clear blog caches
    await clearBlogCaches();
    await cache.del(`blog:${slug}`);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting blog:', error);
    next(error);
  }
};

// Get blog categories (public)
export const getBlogCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { petType } = req.query;

    const cacheKey = `blog-categories:${petType || 'all'}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached
      });
    }

    const query: any = { isPublished: true };
    if (petType && petType !== 'all') {
      query.petType = petType;
    }

    const categories = await Blog.distinct('category', query);
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await Blog.countDocuments({ ...query, category });
        return { name: category, count };
      })
    );

    // Cache for 10 minutes
    await cache.set(cacheKey, categoriesWithCounts, 600);

    res.json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error: any) {
    logger.error('Error fetching blog categories:', error);
    next(error);
  }
};

// Helper function to clear blog caches
const clearBlogCaches = async () => {
  try {
    await cache.delPattern('blogs:*');
    await cache.delPattern('blog-categories:*');
    logger.debug('Blog caches cleared');
  } catch (error: any) {
    logger.error('Error clearing blog caches:', error.message);
  }
};

