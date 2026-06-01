import express, { Express } from "express";
import cors from "cors";
import { appDataSource } from "./config/database";
import { authMiddleware } from "./middlewares/auth.middleware";
import { AuthController } from "./controllers/auth.controller";
import { createAuthRouter } from "./routes/auth.route";
import { AuthService } from "./services/auth.serviec";
import { UserController } from "./controllers/user.controller";
import { createUserRouter } from "./routes/user.route";
import { UserRepository } from "./repositories/user.repository";
import { UserService } from "./services/user.service";

export const createApp = async (): Promise<Express> => {
  if (!appDataSource.isInitialized) {
    await appDataSource.initialize();
  }

  const app = express();
  app.use(cors());
  app.use(express.json());

  const userRepository = UserRepository.fromDataSource(appDataSource);
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

  return app;
};
