import { NextFunction, Request, Response } from "express";
import { isRole } from "../enums/role.enum";
import { verifyAccessToken } from "../services/jwt";
import { RequestWithUser } from "../models/user.types";

export type AuthRequest = RequestWithUser;

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: "Unauthorized",
      message: "Missing or invalid authorization token",
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.path,
    });
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  try {
    const payload = verifyAccessToken(token);

    if (!isRole(payload.role)) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: "Unauthorized",
        message: "Access token contains an unsupported role",
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.path,
      });
    }

    const requestWithUser = req as RequestWithUser;

    requestWithUser.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: "Unauthorized",
      message: "Access token is invalid or expired",
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.path,
    });
  }
};

export const authenticate = authMiddleware;
