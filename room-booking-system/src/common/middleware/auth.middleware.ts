import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export type AuthRequest = Request & {
    user?: {
        id: string;
        email: string;
        role: string;
    };
    file?: any;
};

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            res.status(401).json({
                success: false,
                statusCode: 401,
                error: 'Unauthorized',
                message: 'No token provided',
                timestamp: new Date().toISOString(),
                path: req.path
            });
            return;
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as {
            id: string;
            email: string;
            role: string;
        };

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid or expired token',
            timestamp: new Date().toISOString(),
            path: req.path
        });
    }
};