import { plainToInstance, ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { BookingService, bookingService } from "../services/booking.service";
import { BookingModuleError } from "../services/booking.error";
import { CreateBookingDto } from "../Authentication/dto/create-booking.dto";
import { GetUserBookingHistoryDto } from "../Authentication/dto/get-user-booking-history.dto";
import { UpdateBookingDto } from "../Authentication/dto/update-booking.dto";

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const dto = await this.validateDto<CreateBookingDto>(CreateBookingDto, req.body);
      const booking = await this.bookingService.createBooking(userId, dto);

      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  getOwnerBookings = async (req: Request, res: Response): Promise<Response> => {
    try {
      const ownerId = this.getAuthenticatedUserId(req);
      const dto = await this.validateDto<GetUserBookingHistoryDto>(
        GetUserBookingHistoryDto,
        req.query,
      );
      const result = await this.bookingService.getOwnerBookings(ownerId, {
        page: dto.page,
        limit: dto.limit,
        status: dto.status,
        sortOrder: dto.sortOrder,
      });

      return res.status(200).json({
        success: true,
        message: "Owner booking list fetched successfully",
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const ownerId = this.getAuthenticatedUserId(req);
      const bookingId = req.params.id?.trim();

      if (!bookingId) {
        throw new BookingModuleError("Booking id is required", 400);
      }

      const dto = await this.validateDto<UpdateBookingDto>(UpdateBookingDto, req.body);
      const booking = await this.bookingService.updateBookingStatus(ownerId, bookingId, dto);

      return res.status(200).json({
        success: true,
        message: "Booking status updated successfully",
        data: booking,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  cancelBooking = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const bookingId = req.params.id?.trim();

      if (!bookingId) {
        throw new BookingModuleError("Booking id is required", 400);
      }

      const booking = await this.bookingService.cancelBooking(userId, bookingId);

      return res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: booking,
      });
    } catch (error) {
      return this.handleError(req, res, error);
    }
  };

  getMyBookings = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const dto = await this.validateDto<GetUserBookingHistoryDto>(
        GetUserBookingHistoryDto,
        req.query,
      );
      const result = await this.bookingService.getUserBookings(userId, dto);

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
    if (!req.user?.id) {
      throw new BookingModuleError("Authentication is required to access this resource", 401);
    }

    return req.user.id;
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

      throw new BookingModuleError(
        messages[0] ?? "Validation failed for the request payload",
        400,
      );
    }

    return dto;
  }

  private handleError(req: Request, res: Response, error: unknown): Response {
    if (error instanceof BookingModuleError) {
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
      message: "Unexpected error occurred while processing the booking request",
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
      case 403:
        return "Forbidden";
      case 404:
        return "Not Found";
      case 409:
        return "Conflict";
      default:
        return "Error";
    }
  }
}

export const bookingController = new BookingController(bookingService);
