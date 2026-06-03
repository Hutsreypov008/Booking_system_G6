import { RequestHandler, Router } from "express";
import { UserController } from "../controllers/user.controller";
import { Role } from "../enums/role.enum";
import { authorizeRoles } from "../middlewares/role.middleware";

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

  router.use(authorizeRoles(Role.USER, Role.OWNER));

  router.get("/profile", userController.getProfile);
  router.patch("/profile", userController.updateProfile);
  router.get("/profile/bookings", userController.getBookingHistory);

  return router;
};
