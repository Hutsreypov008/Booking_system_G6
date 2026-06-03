import { RequestHandler, Router } from "express";
import { UserController } from "../controllers/user.controller";
import { requireRole } from "../middlewares/role.middleware";
import { Role } from "../enums/role.enum";

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
  router.get("/all", userController.getAllUsers);
  router.delete("/:id", requireRole([Role.OWNER]), userController.deleteUser);

  return router;
};
