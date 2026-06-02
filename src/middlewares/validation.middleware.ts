import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";

type DtoClass<T extends object> = new () => T;

const formatValidationErrors = (errors: ValidationError[]): string[] => {
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

export const validateBody =
  <T extends object>(Dto: DtoClass<T>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(Dto, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatValidationErrors(errors),
      });
      return;
    }

    req.body = dto;
    next();
  };
