import { Brackets } from "typeorm";
import { AppDataSource } from "../config/database";
import { RoomType } from "../enums/room-type.enum";
import { Room } from "../models/room.entity";

export type SearchRoomFilters = {
  search?: string;
  location?: string;
  type?: RoomType;
  minPrice?: number;
  maxPrice?: number;
};

export const roomRepository = AppDataSource.getRepository(Room);

// Find all rooms
export const findAllRooms = (): Promise<Room[]> => {
  return roomRepository.find({
    relations: { images: true },
    order: { createdAt: "DESC" },
  });
};

// Search and filter rooms
export const searchRooms = (filters: SearchRoomFilters): Promise<Room[]> => {
  const query = roomRepository
    .createQueryBuilder("room")
    .leftJoinAndSelect("room.images", "images")
    .orderBy("room.createdAt", "DESC");

  if (filters.search) {
    query.andWhere(
      new Brackets((qb) => {
        qb.where("room.title LIKE :search", { search: `%${filters.search}%` })
          .orWhere("room.description LIKE :search", { search: `%${filters.search}%` })
          .orWhere("room.location LIKE :search", { search: `%${filters.search}%` });
      })
    );
  }

  if (filters.location) {
    query.andWhere("room.location LIKE :location", { location: `%${filters.location}%` });
  }

  if (filters.type) {
    query.andWhere("room.type = :type", { type: filters.type });
  }

  if (filters.minPrice !== undefined) {
    query.andWhere("room.price >= :minPrice", { minPrice: filters.minPrice });
  }

  if (filters.maxPrice !== undefined) {
    query.andWhere("room.price <= :maxPrice", { maxPrice: filters.maxPrice });
  }

  return query.getMany();
};

// Find rooms by owner id
export const findRoomsByOwnerId = (ownerId: string): Promise<Room[]> => {
  return roomRepository.find({
    where: { ownerId },
    relations: { images: true },
    order: { createdAt: "DESC" },
  });
};

// Find one room by id
export const findRoomById = (id: string): Promise<Room | null> => {
  return roomRepository.findOne({
    where: { id },
    relations: { images: true },
  });
};

// Delete one room by id
export const deleteRoomById = async (id: string): Promise<boolean> => {
  const result = await roomRepository.delete(id);
  return (result.affected ?? 0) > 0;
};
