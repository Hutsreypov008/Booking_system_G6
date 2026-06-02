import { NextFunction, Request, Response } from "express";
import { Role } from "../enums/role.enum";

export const requireRole =
  (allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Permission denied" });
      return;
    }

    next();
  };
