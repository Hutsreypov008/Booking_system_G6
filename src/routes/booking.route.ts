import { Router } from "express";
import { Role } from "../enums/role.enum";
import { bookingController } from "../controllers/booking.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();
const allowUser = requireRole([Role.USER]);
const allowOwner = requireRole([Role.OWNER]);

router.post("/", authenticateJWT, allowUser, bookingController.create);
router.get("/me", authenticateJWT, bookingController.getMyBookings);
router.get("/owner", authenticateJWT, allowOwner, bookingController.getOwnerBookings);
router.patch("/:id/status", authenticateJWT, allowOwner, bookingController.updateStatus);
router.patch("/:id/cancel", authenticateJWT, bookingController.cancelBooking);

export default router;
