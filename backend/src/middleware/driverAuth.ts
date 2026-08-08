import { Response, NextFunction } from 'express';
import { AuthRequest, protect } from './auth';

/** Dedicated driver guard. Drivers never inherit staff/admin permissions. */
export const driverOnly = [
  protect,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Driver access required'
      });
    }
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This driver account is inactive'
      });
    }
    if (req.user.isPasswordExpired()) {
      return res.status(403).json({
        success: false,
        message: 'Driver password expired. Contact an administrator.'
      });
    }
    next();
  }
];
