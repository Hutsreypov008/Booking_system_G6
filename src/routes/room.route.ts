import { Router } from "express";
import { Role } from "../enums/role.enum";
import { roomController } from "../controllers/room.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { handleUploadImages } from "../middlewares/room-upload.middleware";
import {
  normalizeRoomBody,
  validateCreateRoom,
  validateUpdateAvailability,
  validateUpdateRoom,
} from "../middlewares/room-validation.middleware";

const router = Router();

const allowRoomOwner = requireRole([Role.ADMIN, Role.OWNER]);
const findAllRooms = roomController.findAll.bind(roomController);
const findMyRooms = roomController.findMine.bind(roomController);
const findRoomAvailability = roomController.findAvailability.bind(roomController);
const findOneRoom = roomController.findOne.bind(roomController);
const createRoom = roomController.create.bind(roomController);
const updateAvailability = roomController.updateAvailability.bind(roomController);
const updateRoom = roomController.update.bind(roomController);
const deleteRoom = roomController.delete.bind(roomController);

// Get all room listings
router.get("/", findAllRooms);

// Get authenticated owner's room listings
router.get("/mine", authenticateJWT, allowRoomOwner, findMyRooms);

// Get one room availability
router.get("/:id/availability", findRoomAvailability);

// Get one room listing detail
router.get("/:id", findOneRoom);

// Create room listing
router.post("/", handleUploadImages, normalizeRoomBody, validateCreateRoom, createRoom);

// Update room information
router.patch("/:id", normalizeRoomBody, validateUpdateRoom, updateRoom);

// Update room availability
router.patch("/:id/availability", normalizeRoomBody, validateUpdateAvailability, updateAvailability);

// Delete room listing
router.delete("/:id", deleteRoom);

export default router;
