import { Request, Response } from "express";
import { RoomType } from "../../../common/enums/room-type.enum";
import { sendSuccess } from "../../../common/utils/response";
import { SearchRoomDto } from "../dto/search-room.dto";
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

const getQueryValue = (value: unknown): string | undefined => {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getQueryNumber = (value: unknown): number | undefined => {
  const queryValue = getQueryValue(value);
  if (!queryValue) {
    return undefined;
  }

  const numberValue = Number(queryValue);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const normalizeRoomType = (value: unknown): RoomType | undefined => {
  const queryValue = getQueryValue(value);
  if (!queryValue) {
    return undefined;
  }

  const roomType = queryValue.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return Object.values(RoomType).includes(roomType as RoomType) ? (roomType as RoomType) : undefined;
};

const getSearchFilters = (req: Request): SearchRoomDto => {
  return {
    search: getQueryValue(req.query.search),
    location: getQueryValue(req.query.location),
    type: normalizeRoomType(req.query.type),
    minPrice: getQueryNumber(req.query.minPrice),
    maxPrice: getQueryNumber(req.query.maxPrice),
  };
};

// Get all room listings
export class RoomController {
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const rooms = await roomService.searchRooms(getSearchFilters(req));
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

  // Get one room listing detail
  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const roomId = getRoomId(req);

      if (!roomId) {
        res.status(400).json({ success: false, message: "Valid room id is required" });
        return;
      }

      const room = await roomService.getRoomById(roomId);
      sendSuccess(res, "Room retrieved successfully", room);
    } catch (error) {
      res.status(404).json({ success: false, message: (error as Error).message });
    }
  }

  // Get one room availability
  async findAvailability(req: Request, res: Response): Promise<void> {
    try {
      const roomId = getRoomId(req);

      if (!roomId) {
        res.status(400).json({ success: false, message: "Valid room id is required" });
        return;
      }

      const availability = await roomService.getRoomAvailability(roomId);
      sendSuccess(res, "Room availability retrieved successfully", availability);
    } catch (error) {
      res.status(404).json({ success: false, message: (error as Error).message });
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
