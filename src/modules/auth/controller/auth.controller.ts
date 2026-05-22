import { plainToInstance, ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { AuthModuleError } from "../errors/auth.error";
import { ForgotPasswordDto } from "../dto/forgot-password.dto";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { AuthService } from "../service/auth.serviec";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto = await this.validateDto<RegisterDto>(RegisterDto, req.body);
      const result = await this.authService.register(dto);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto = await this.validateDto<LoginDto>(LoginDto, req.body);
      const result = await this.authService.login(dto);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto = await this.validateDto<ForgotPasswordDto>(ForgotPasswordDto, req.body);
      const result = await this.authService.forgotPassword(dto);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto = await this.validateDto<ResetPasswordDto>(ResetPasswordDto, req.body);
      const result = await this.authService.resetPassword(dto);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  private async validateDto<T extends object>(
    dtoClass: ClassConstructor<T>,
    payload: unknown,
  ): Promise<T> {
    const dto = plainToInstance(dtoClass, payload, {
      enableImplicitConversion: true,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors
        .flatMap((error: { constraints?: Record<string, string> }) =>
          Object.values(error.constraints ?? {}),
        )
        .filter(Boolean);

      throw new AuthModuleError(messages[0] ?? "Validation failed", 400);
    }

    return dto;
  }

  private handleError(req: Request, res: Response, error: unknown): Response {
    if (error instanceof AuthModuleError) {
      return res.status(error.statusCode).json({
        success: false,
        statusCode: error.statusCode,
        error: this.resolveErrorName(error.statusCode),
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.path,
      });
    }

    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: "Internal Server Error",
      message: "Unexpected error occurred while processing the auth request",
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.path,
    });
  }

  private resolveErrorName(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return "Bad Request";
      case 401:
        return "Unauthorized";
      case 404:
        return "Not Found";
      case 409:
        return "Conflict";
      default:
        return "Error";
    }
  }
}
