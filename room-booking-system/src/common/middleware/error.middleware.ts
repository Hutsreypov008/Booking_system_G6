import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    public statusCode: number;
    public status: string;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = err.message || 'Internal Server Error';

    console.error({
        level: 'ERROR',
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    res.status(statusCode).json({
        success: false,
        statusCode: statusCode,
        error: statusCode === 500 ? 'Internal Server Error' : message,
        message: statusCode === 500 ? 'Something went wrong' : message,
        timestamp: new Date().toISOString(),
        path: req.path
    });
};