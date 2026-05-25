import { CreateRoomDto } from "../dto/create-room.dto";
import { SearchRoomDto } from "../dto/search-room.dto";
import { UpdateRoomDto } from "../dto/update-room.dto";
import { RoomImage } from "../entity/room-image.entity";
import { Room } from "../entity/room.entity";
import {
  deleteRoomById,
  findAllRooms,
  findRoomById,
  findRoomsByOwnerId,
  roomRepository,
  searchRooms,
} from "../repository/room.repository";

type CreateRoomInput = {
  ownerId: string;
  roomData: CreateRoomDto;
  imageFiles?: Express.Multer.File[];
};

// Save only the public image path in database
const getImageUrl = (file: Express.Multer.File): string => {
  return `/uploads/rooms/${file.filename}`;
};

// Convert uploaded files to room image records
const createRoomImages = (files: Express.Multer.File[] = []): RoomImage[] => {
  return files.map((file) => {
    const image = new RoomImage();
    image.imageUrl = getImageUrl(file);
    return image;
  });
};

const removeImageBackReferences = (room: Room): Room => {
  room.images?.forEach((image) => {
    delete (image as Partial<RoomImage>).room;
  });

  return room;
};

const removeRoomsImageBackReferences = (rooms: Room[]): Room[] => {
  return rooms.map(removeImageBackReferences);
};

// Create room and save it to database
export class RoomService {
  // Get all room listings
  async getRooms(): Promise<Room[]> {
    const rooms = await findAllRooms();
    return removeRoomsImageBackReferences(rooms);
  }

  // Search and filter room listings
  async searchRooms(filters: SearchRoomDto): Promise<Room[]> {
    const rooms = await searchRooms(filters);
    return removeRoomsImageBackReferences(rooms);
  }

  // Get room listings owned by one owner
  async getRoomsByOwner(ownerId: string): Promise<Room[]> {
    const rooms = await findRoomsByOwnerId(ownerId);
    return removeRoomsImageBackReferences(rooms);
  }

  async createRoom({ ownerId, roomData, imageFiles = [] }: CreateRoomInput): Promise<Room> {
    const images = createRoomImages(imageFiles);

    // Prepare room data before saving
    const room = roomRepository.create({
      ownerId,
      title: roomData.title,
      type: roomData.type,
      location: roomData.location,
      price: roomData.price.toFixed(2),
      description: roomData.description,
      isAvailable: roomData.isAvailable ?? true,
      images,
    });

    // Save room with images
    const savedRoom = await roomRepository.save(room);
    return removeImageBackReferences(savedRoom);
  }

  // Update room information
  async updateRoom(id: string, roomData: UpdateRoomDto): Promise<Room> {
    const room = await findRoomById(id);

    if (!room) {
      throw new Error("Room not found");
    }

    // Keep old value when new value is not provided
    room.title = roomData.title ?? room.title;
    room.type = roomData.type ?? room.type;
    room.location = roomData.location ?? room.location;
    room.price = roomData.price !== undefined ? roomData.price.toFixed(2) : room.price;
    room.description = roomData.description ?? room.description;
    room.isAvailable = roomData.isAvailable ?? room.isAvailable;

    const savedRoom = await roomRepository.save(room);
    return removeImageBackReferences(savedRoom);
  }

  // Update room availability only
  async updateAvailability(id: string, isAvailable: boolean): Promise<Room> {
    const room = await findRoomById(id);

    if (!room) {
      throw new Error("Room not found");
    }
    room.isAvailable = isAvailable;

    const savedRoom = await roomRepository.save(room);
    return removeImageBackReferences(savedRoom);
  }

  // Delete room listing
  async deleteRoom(id: string): Promise<void> {
    const isDeleted = await deleteRoomById(id);

    if (!isDeleted) {
      throw new Error("Room not found");
    }
  }
}

export const roomService = new RoomService();
