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

// Find one room by id
export const findRoomById = (id: string): Promise<Room | null> => {
  return roomRepository.findOne({
    where: { id },
    relations: { images: true },
  });
};
