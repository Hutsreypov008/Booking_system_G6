import { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: "Not Found",
    message: "Resource not found",
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.path,
  });
};

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const statusCode =
    typeof error?.status === "number" && error.status >= 400 ? error.status : 500;

  res.status(statusCode).json({
    success: false,
    statusCode,
    error: statusCode === 500 ? "Internal Server Error" : "Bad Request",
    message:
      statusCode === 500
        ? "Unexpected error occurred while processing the request"
        : "Invalid request",
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.path,
  });
};
