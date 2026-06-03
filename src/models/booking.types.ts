import { BookingStatus } from "../enums/booking-status.enum";

export interface OwnerBookingQuery {
  page: number;
  limit: number;
  status?: string;
  sortOrder: "ASC" | "DESC";
}

export interface OwnerBookingItem {
  id: string;
  roomId: string;
  userId: string;
  status: BookingStatus;
  checkInDate: string | null;
  checkOutDate: string | null;
  totalPrice: number;
  createdAt: string | null;
  roomTitle: string | null;
  roomLocation: string | null;
  roomPrice: number | null;
  userName: string | null;
  userEmail: string | null;
}
