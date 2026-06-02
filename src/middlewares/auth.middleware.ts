import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/jwt";
import { Role } from "../enums/role.enum";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}

const isRole = (value: string): value is Role => {
  return Object.values(Role).includes(value as Role);
};

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
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
    const roleValue = payload.role?.toString().toUpperCase();

    if (!roleValue || !isRole(roleValue)) {
      throw new Error("Invalid user role");
    }

    req.user = {
      id: payload.sub,
      role: roleValue,
    };

    next();
  } catch (_error) {
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

export const authMiddleware = authenticateJWT;
