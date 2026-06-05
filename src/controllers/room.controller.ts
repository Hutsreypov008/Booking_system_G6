import { Request, Response } from "express";
import { RoomType } from "../enums/room-type.enum";
import { roomService, SearchRoomFilters } from "../services/room.service";


const sendSuccess = <T>(res: Response, message: string, data: T, statusCode = 200): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Read owner id from the logged-in user's token
const getOwnerId = (req: Request): string | null => {
  return req.user?.id?.trim() || null;
};

// Collect uploaded room image files from request
const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  return Array.isArray(req.files) ? req.files : [];
};

// Read room id from route params
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

const getSearchFilters = (req: Request): SearchRoomFilters => {
  return {
    search: getQueryValue(req.query.search),
    location: getQueryValue(req.query.location),
    type: normalizeRoomType(req.query.type),
    minPrice: getQueryNumber(req.query.minPrice),
    maxPrice: getQueryNumber(req.query.maxPrice),
  };
};

export class RoomController {
  // User can view all room listings and filter/search rooms
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const rooms = await roomService.searchRooms(getSearchFilters(req));
      sendSuccess(res, "Rooms retrieved successfully", rooms);
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  // Owner can view only their own room listings
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

  // User can view detail for one room by room id
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

  // User can check if one room is available
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

  // Owner can create a new room listing with images
  async create(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = getOwnerId(req);

      if (!ownerId) {
        res.status(401).json({ success: false, message: "Valid owner is required" });
        return;
      }

      // Save room data and uploaded images
      const room = await roomService.createRoom({
        ownerId,
        roomData: req.body,
        imageFiles: getUploadedFiles(req),
      });

      // Return newly created room
      sendSuccess(res, "Room listing created successfully", room, 201);
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  }

  // Owner can update room information
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

  // Owner can change room availability status
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

  // Owner can delete a room listing
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
