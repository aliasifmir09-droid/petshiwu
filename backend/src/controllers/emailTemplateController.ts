import { Response, NextFunction } from 'express';
import EmailTemplate from '../models/EmailTemplate';
import { AuthRequest } from '../middleware/auth';
import { extractObjectId } from '../utils/types';
import logger from '../utils/logger';
import { seedEmailTemplates } from '../utils/seedEmailTemplates';

// Helper function to normalize email template _id to string
const normalizeTemplateId = (template: any): any => {
  if (!template) return template;
  
  // Convert to plain object if it's a Mongoose document
  const plainTemplate = template.toObject ? template.toObject() : template;
  
  return {
    ...plainTemplate,
    _id: plainTemplate._id ? String(plainTemplate._id) : plainTemplate._id
  };
};

// Helper function to normalize array of email templates
const normalizeTemplates = (templates: any[]): any[] => {
  return templates.map(normalizeTemplateId);
};

/**
 * Get all email templates
 */
export const getEmailTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await EmailTemplate.find().sort({ name: 1 }).lean();

    // Normalize _id to string for all templates
    const normalizedTemplates = normalizeTemplates(templates);

    res.status(200).json({
      success: true,
      data: normalizedTemplates
    });
  } catch (error: any) {
    logger.error('Error fetching email templates:', error);
    next(error);
  }
};

/**
 * Get single email template
 */
export const getEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const templateId = extractObjectId(id);

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const template = await EmailTemplate.findById(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Normalize _id to string
    const normalizedTemplate = normalizeTemplateId(template);

    res.status(200).json({
      success: true,
      data: normalizedTemplate
    });
  } catch (error: any) {
    logger.error('Error fetching email template:', error);
    next(error);
  }
};

/**
 * Create email template
 */
export const createEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, subject, body, variables, isActive } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Name, subject, and body are required'
      });
    }

    // Check if template with same name exists
    const existing = await EmailTemplate.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Template with this name already exists'
      });
    }

    const template = await EmailTemplate.create({
      name,
      subject,
      body,
      variables: variables || [],
      isActive: isActive !== undefined ? isActive : true
    });

    // Normalize _id to string
    const normalizedTemplate = normalizeTemplateId(template);

    res.status(201).json({
      success: true,
      data: normalizedTemplate
    });
  } catch (error: any) {
    logger.error('Error creating email template:', error);
    next(error);
  }
};

/**
 * Update email template
 */
export const updateEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const templateId = extractObjectId(id);

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const { name, subject, body, variables, isActive } = req.body;

    // Check if name is being changed and if it conflicts
    if (name) {
      const existing = await EmailTemplate.findOne({ name, _id: { $ne: templateId } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Template with this name already exists'
        });
      }
    }

    const template = await EmailTemplate.findByIdAndUpdate(
      templateId,
      {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(body && { body }),
        ...(variables !== undefined && { variables }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Normalize _id to string
    const normalizedTemplate = normalizeTemplateId(template);

    res.status(200).json({
      success: true,
      data: normalizedTemplate
    });
  } catch (error: any) {
    logger.error('Error updating email template:', error);
    next(error);
  }
};

/**
 * Delete email template
 */
export const deleteEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const templateId = extractObjectId(id);

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const template = await EmailTemplate.findByIdAndDelete(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting email template:', error);
    next(error);
  }
};

/**
 * Seed default email templates
 */
export const seedTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await seedEmailTemplates();
    
    res.status(200).json({
      success: true,
      message: 'Default email templates seeded successfully'
    });
  } catch (error: any) {
    logger.error('Error seeding email templates:', error);
    next(error);
  }
};

