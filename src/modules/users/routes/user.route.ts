import { RequestHandler, Router } from "express";
import { UserController } from "../controller/user.controller";

interface CreateUserRouterOptions {
  userController: UserController;
  authMiddleware?: RequestHandler;
}

export const createUserRouter = ({
  userController,
  authMiddleware,
}: CreateUserRouterOptions): Router => {
  const router = Router();

  if (authMiddleware) {
    router.use(authMiddleware);
  }

  router.get("/me", userController.getProfile);
  router.patch("/me", userController.updateProfile);
  router.get("/me/bookings", userController.getBookingHistory);

  return router;
};
