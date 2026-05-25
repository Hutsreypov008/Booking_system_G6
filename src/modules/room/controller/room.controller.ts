import { Request, Response } from "express";
import { sendSuccess } from "../../../common/utils/response";
import { roomService } from "../service/room.service";

// Get owner id from authenticated request
const getOwnerId = (req: Request): string | null => {
  return req.user?.id?.trim() || null;
};

// Get uploaded room images from multer
const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  return Array.isArray(req.files) ? req.files : [];
};

// Get room id from route params
const getRoomId = (req: Request): string | null => {
  return req.params.id?.trim() || null;
};

export class RoomController {
  // Get all room listings
  async findAll(_req: Request, res: Response): Promise<void> {
    try {
      const rooms = await roomService.getRooms();
      sendSuccess(res, "Rooms retrieved successfully", rooms);
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  // Get authenticated owner's room listings
  async findMine(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = getOwnerId(req);

      if (!ownerId) {
        res.status(401).json({ success: false, message: "Valid owner is required" });
        return;
      }

      const rooms = await roomService.getRoomsByOwner(ownerId);
      sendSuccess(res, "Owner rooms retrieved successfully", rooms);
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  // Create room listing
  async create(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = getOwnerId(req);

      // Owner id is required to know who created the room
      if (!ownerId) {
        res.status(401).json({ success: false, message: "Valid owner is required" });
        return;
      }

      // Send room data and images to service
      const room = await roomService.createRoom({
        ownerId,
        roomData: req.body,
        imageFiles: getUploadedFiles(req),
      });

      // Return created room
      sendSuccess(res, "Room listing created successfully", room, 201);
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  }

  // Update room information
  async update(req: Request, res: Response): Promise<void> {
    try {
      const roomId = getRoomId(req);

      if (!roomId) {
        res.status(400).json({ success: false, message: "Valid room id is required" });
        return;
      }

      const room = await roomService.updateRoom(roomId, req.body);

      sendSuccess(res, "Room updated successfully", room);
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  }

  // Update room availability
  async updateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const roomId = getRoomId(req);
      if (!roomId) {
        res.status(400).json({ success: false, message: "Valid room id is required" });
        return;
      }
      const room = await roomService.updateAvailability(roomId, req.body.isAvailable);
      sendSuccess(res, "Room availability updated successfully", room);
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  }

  // Delete room listing
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const roomId = getRoomId(req);

      if (!roomId) {
        res.status(400).json({ success: false, message: "Valid room id is required" });
        return;
      }
      await roomService.deleteRoom(roomId);

      sendSuccess(res, "Room deleted successfully", null);
    } catch (error) {
      res.status(404).json({ success: false, message: (error as Error).message });
    }
  }
}

export const roomController = new RoomController();
