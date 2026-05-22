import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Authentication required',
                timestamp: new Date().toISOString(),
                path: req.path
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                statusCode: 403,
                error: 'Forbidden',
                message: 'Insufficient permissions',
                timestamp: new Date().toISOString(),
                path: req.path
            });
            return;
        }

        next();
    };
};