import { NextFunction, Request, Response } from "express";
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

export const authenticateJWT = (req: Request, _res: Response, next: NextFunction): void => {
  const userId = req.header("x-user-id");
  const role = req.header("x-user-role") as Role | undefined;

  if (userId && role) {
    req.user = { id: userId, role };
  }

  next();
};
