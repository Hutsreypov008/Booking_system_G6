import { Request, Response } from "express";

export class UserController {
  index(_req: Request, res: Response): void {
    res.json({
      success: true,
      message: "Users retrieved successfully",
      data: [],
    });
  }

  create(req: Request, res: Response): void {
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: req.body,
    });
  }

  delete(req: Request, res: Response): void {
    res.json({
      success: true,
      message: "User deleted successfully",
      data: {
        id: req.params.id,
      },
    });
  }
}
