import express, { Express } from "express";
import cors from "cors";
import { appDataSource } from "./config/database";
import { env } from "./config/env";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware";
import { authMiddleware } from "./middlewares/auth.middleware";
import { createRateLimiter, securityHeaders } from "./middlewares/security.middleware";
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
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(securityHeaders);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: env.jsonBodyLimit }));

  const userRepository = UserRepository.fromDataSource(appDataSource);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  const authService = new AuthService(userRepository);
  const authController = new AuthController(authService);

  app.get("/", (_req, res) => {
    res.status(200).json({
      message: "Booking System API is running",
    });
  });

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
      message: "Server is healthy",
    });
  });

  app.use(
    "/api/v1/auth",
    createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 30 }),
    createAuthRouter({ authController, authMiddleware }),
  );
  app.use("/api/v1/users", createUserRouter({ userController, authMiddleware }));
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
