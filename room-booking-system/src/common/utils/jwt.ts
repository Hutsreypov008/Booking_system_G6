import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload as any, env.JWT_SECRET as any, {
        expiresIn: env.JWT_EXPIRES_IN
    } as any);
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.JWT_SECRET as any) as JwtPayload;
};