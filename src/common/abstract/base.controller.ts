import { Response } from "express";

export abstract class BaseController {
  // Send success response
  protected success<T>(res: Response, message: string, data: T, statusCode = 200): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  // Send error response
  protected error(res: Response, message: string, statusCode = 400): void {
    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
