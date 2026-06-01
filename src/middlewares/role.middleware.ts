import { NextFunction, Request, Response } from "express";
import { Role } from "../enums/role.enum";
import { RequestWithUser } from "../models/user.types";
import { getRolePermissions, RolePermissionKey } from "../models/role-permissions";

const forbiddenResponse = (req: Request, res: Response, message: string): Response => {
  return res.status(403).json({
    success: false,
    statusCode: 403,
    error: "Forbidden",
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.path,
  });
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const requestWithUser = req as RequestWithUser;
    const role = requestWithUser.user?.role;

    if (!role) {
      return forbiddenResponse(req, res, "Authentication role is required");
    }

    if (!allowedRoles.includes(role as Role)) {
      return forbiddenResponse(req, res, "You do not have permission to access this resource");
    }

    next();
  };
};

export const authorizePermission = (permission: RolePermissionKey) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const requestWithUser = req as RequestWithUser;
    const role = requestWithUser.user?.role;

    if (!role) {
      return forbiddenResponse(req, res, "Authentication role is required");
    }

    if (!getRolePermissions(role)[permission]) {
      return forbiddenResponse(req, res, "You do not have permission to perform this action");
    }

    next();
  };
};
