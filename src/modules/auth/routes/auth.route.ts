import { Router } from "express";
import { AuthController } from "../controller/auth.controller";

interface CreateAuthRouterOptions {
  authController: AuthController;
}

export const createAuthRouter = ({
  authController,
}: CreateAuthRouterOptions): Router => {
  const router = Router();

  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/forgot-password", authController.forgotPassword);
  router.post("/reset-password", authController.resetPassword);

  return router;
};
