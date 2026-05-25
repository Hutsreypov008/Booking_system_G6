import { RoomType } from "../../../common/enums/room-type.enum";

export type SearchRoomDto = {
  search?: string;
  location?: string;
  type?: RoomType;
  minPrice?: number;
  maxPrice?: number;
};
