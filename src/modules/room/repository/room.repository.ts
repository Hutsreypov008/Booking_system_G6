import { AppDataSource } from "../../../config/database";
import { Room } from "../entity/room.entity";

export const roomRepository = AppDataSource.getRepository(Room);

// Find all rooms
export const findAllRooms = (): Promise<Room[]> => {
  return roomRepository.find({
    relations: { images: true },
    order: { createdAt: "DESC" },
  });
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
