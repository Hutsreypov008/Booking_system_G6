import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { authenticateJWT } from "../../../common/middleware/auth.middleware";
import { requireRole } from "../../../common/middleware/role.middleware";
import { validateBody } from "../../../common/middleware/validation.middleware";
import { Role } from "../../../common/enums/role.enum";
import { roomController } from "../controller/room.controller";
import { CreateRoomDto } from "../dto/create-room.dto";
import { UpdateRoomDto } from "../dto/update-room.dto";
import { uploadRoomImages } from "../upload/multer";

const router = Router();

const allowRoomOwner = requireRole([Role.ADMIN, Role.OWNER]);
const uploadImages = uploadRoomImages.array("images", 5);
const validateCreateRoom = validateBody(CreateRoomDto);
const validateUpdateRoom = validateBody(UpdateRoomDto);
const findAllRooms = roomController.findAll.bind(roomController);
const createRoom = roomController.create.bind(roomController);
const updateRoom = roomController.update.bind(roomController);

const normalizeRoomBody = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body.isAvailable === undefined && req.body.is_available !== undefined) {
    req.body.isAvailable = req.body.is_available;
  }

  next();
};

const handleUploadImages = (req: Request, res: Response, next: NextFunction): void => {
  uploadImages(req, res, (error) => {
    if (error) {
      const message =
        error instanceof multer.MulterError || error instanceof Error
          ? error.message
          : "Image upload failed";

      res.status(400).json({ success: false, message });
      return;
    }

    next();
  });
};

// Get all room listings
router.get("/", findAllRooms);

// Create room listing
router.post(
  "/",
  authenticateJWT,
  allowRoomOwner,
  handleUploadImages,
  normalizeRoomBody,
  validateCreateRoom,
  createRoom
);

// Update room information
router.patch("/:id", authenticateJWT, allowRoomOwner, normalizeRoomBody, validateUpdateRoom, updateRoom);

export default router;
