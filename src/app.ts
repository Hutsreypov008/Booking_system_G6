import express, { Express } from "express";
import cors from "cors";
import path from "path";
import { AppDataSource } from "./config/database";
import { authMiddleware } from "./middlewares/auth.middleware";
import { AuthController } from "./controllers/auth.controller";
import { createAuthRouter } from "./routes/auth.route";
import { AuthService } from "./services/auth.serviec";
import { UserController } from "./controllers/user.controller";
import { createUserRouter } from "./routes/user.route";
import { UserRepository } from "./repositories/user.repository";
import { UserService } from "./services/user.service";
import roomRoutes from "./routes/room.route";
import bookingRoutes from "./routes/booking.route";

export const createApp = async (): Promise<Express> => {
  if (!AppDataSource.isInitialized) {
    throw new Error("Database must be initialized before creating the app");
  }

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  const userRepository = UserRepository.fromDataSource(AppDataSource);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  const authService = new AuthService(userRepository);
  const authController = new AuthController(authService);

  app.get("/", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Booking System API is running",
      data: {
        health: "/api/v1/health",
        auth: "/api/v1/auth",
        users: "/api/v1/users",
        rooms: "/api/v1/rooms",
      },
    });
  });

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is healthy",
      data: {
        database: "connected",
      },
    });
  });

  app.use("/api/v1/auth", createAuthRouter({ authController, authMiddleware }));
  app.use("/api/v1/users", createUserRouter({ userController, authMiddleware }));
  app.use("/api/v1/rooms", roomRoutes);
  app.use("/api/v1/bookings", bookingRoutes);

  return app;
};
