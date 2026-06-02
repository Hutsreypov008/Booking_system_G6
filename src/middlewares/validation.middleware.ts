import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export const validateDto = (dtoClass: any) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const dtoInstance = plainToInstance(dtoClass, req.body);
        const errors = await validate(dtoInstance);

        if (errors.length > 0) {
            const validationErrors = errors.map(error => ({
                property: error.property,
                constraints: error.constraints
            }));

            res.status(400).json({
                success: false,
                statusCode: 400,
                error: 'Validation Failed',
                message: 'Request validation failed',
                errors: validationErrors,
                datetime: new Date().toISOString(),
                path: req.path
            });
            return;
        }

        req.body = dtoInstance;
        next();
    };
};