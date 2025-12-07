import { Response, NextFunction } from 'express';
import EmailTemplate from '../models/EmailTemplate';
import { AuthRequest } from '../middleware/auth';
import { extractObjectId } from '../utils/types';
import logger from '../utils/logger';

/**
 * Get all email templates
 */
export const getEmailTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await EmailTemplate.find().sort({ name: 1 }).lean();

    res.status(200).json({
      success: true,
      data: templates
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

    res.status(200).json({
      success: true,
      data: template
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

    res.status(201).json({
      success: true,
      data: template
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

    res.status(200).json({
      success: true,
      data: template
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

