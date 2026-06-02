import { plainToInstance, ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { GetUserBookingHistoryDto } from "../Authentication/dto/get-user-booking-history.dto";
import { UpdateUserDto } from "../Authentication/dto/update-user.dto";
import { UserModuleError } from "../services/user.error";
import { UserService } from "../services/user.service";
import { RequestWithUser } from "../models/user.types";

export class UserController {
  constructor(private readonly userService: UserService) {}

  getProfile = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const profile = await this.userService.getProfile(userId);

      return res.status(200).json({
        success: true,
        message: "User profile fetched successfully",
        data: profile,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const dto = await this.validateDto<UpdateUserDto>(UpdateUserDto, req.body);
      const profile = await this.userService.updateProfile(userId, dto);

      return res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        data: profile,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  getBookingHistory = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const dto = await this.validateDto<GetUserBookingHistoryDto>(
        GetUserBookingHistoryDto,
        req.query,
      );
      const result = await this.userService.getBookingHistory(userId, dto);

      return res.status(200).json({
        success: true,
        message: "User booking history fetched successfully",
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  private getAuthenticatedUserId(req: Request): string {
    const requestWithUser = req as RequestWithUser;

    if (!requestWithUser.user?.id) {
      throw new UserModuleError("Authentication is required to access this resource", 401);
    }

    return requestWithUser.user.id;
  }

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

      throw new UserModuleError(
        messages[0] ?? "Validation failed for the request payload",
        400,
      );
    }

    return dto;
  }

  private handleError(req: Request, res: Response, error: unknown): Response {
    if (error instanceof UserModuleError) {
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
      message: "Unexpected error occurred while processing the user request",
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
