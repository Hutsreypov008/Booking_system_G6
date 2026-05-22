import express, { Express } from "express";
import cors from "cors";
import { appDataSource } from "./config/database";
import { authMiddleware } from "./common/middleware/auth.middleware";
import { AuthController } from "./modules/auth/controller/auth.controller";
import { createAuthRouter } from "./modules/auth/routes/auth.route";
import { AuthService } from "./modules/auth/service/auth.serviec";
import { UserController } from "./modules/users/controller/user.controller";
import { createUserRouter } from "./modules/users/routes/user.route";
import { UserRepository } from "./modules/users/repository/user.repository";
import { UserService } from "./modules/users/service/user.service";

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

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is healthy",
      data: {
        database: "connected",
      },
    });
  });

  app.use("/api/v1/auth", createAuthRouter({ authController }));
  app.use("/api/v1/users", createUserRouter({ userController, authMiddleware }));

  return app;
};
