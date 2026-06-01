import { RequestHandler, Router } from "express";
import { AuthController } from "../controllers/auth.controller";

interface CreateAuthRouterOptions {
  authController: AuthController;
  authMiddleware?: RequestHandler;
}

export const createAuthRouter = ({
  authController,
  authMiddleware,
}: CreateAuthRouterOptions): Router => {
  const router = Router();

  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/forgot-password", authController.forgotPassword);
  router.post("/reset-password", authController.resetPassword);

  if (authMiddleware) {
    router.get("/me", authMiddleware, authController.me);
  }

  return router;
};
