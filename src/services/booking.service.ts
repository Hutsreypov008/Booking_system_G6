import { UserRepository } from "../repositories/user.repository";
import { AppDataSource } from "../config/database";
import { findRoomById } from "../repositories/room.repository";
import {
  bookingRepository,
  createBooking,
  findBookingById,
  findBookingByIdForOwner,
  getBookingsByOwner,
  findOverlappingPendingBookingsByRoom,
} from "../repositories/booking.repository";

import { BookingModuleError } from "./booking.error";
import { BookingStatus } from "../enums/booking-status.enum";
import { CreateBookingDto } from "../Authentication/dto/create-booking.dto";
import { UpdateBookingDto } from "../Authentication/dto/update-booking.dto";
import { GetUserBookingHistoryDto } from "../Authentication/dto/get-user-booking-history.dto";
import { OwnerBookingQuery } from "../models/booking.types";

export class BookingService {
  private readonly userRepository = UserRepository.fromDataSource(AppDataSource);

  async createBooking(userId: string, dto: CreateBookingDto) {
    const room = await findRoomById(dto.roomId);

    if (!room) {
      throw new BookingModuleError("Room not found", 404);
    }

    if (!room.isAvailable) {
      throw new BookingModuleError("Room is not available for booking", 409);
    }

    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      throw new BookingModuleError("Invalid booking dates", 400);
    }

    if (checkOut <= checkIn) {
      throw new BookingModuleError("checkOutDate must be after checkInDate", 400);
    }

    const booking = await createBooking({
      roomId: dto.roomId,
      userId,
      status: BookingStatus.PENDING,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      totalPrice: dto.totalPrice.toFixed(2),
    });

    return booking;
  }

  async getOwnerBookings(ownerId: string, query: OwnerBookingQuery) {
    return getBookingsByOwner(ownerId, query);
  }

  async updateBookingStatus(ownerId: string, bookingId: string, dto: UpdateBookingDto) {
    const booking = await findBookingByIdForOwner(bookingId, ownerId);

    if (!booking) {
      throw new BookingModuleError("Booking not found for this owner", 404);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BookingModuleError("Cancelled bookings cannot be updated", 400);
    }

    const nextStatus = dto.status as BookingStatus;

    // Auto-reject only overlapping PENDING bookings when approving.
    if (nextStatus === BookingStatus.APPROVED) {
      const overlappingPendingBookings = await findOverlappingPendingBookingsByRoom(
        booking.roomId,
        booking.checkInDate,
        booking.checkOutDate,
        booking.id,
      );

      if (overlappingPendingBookings.length > 0) {
        for (const pending of overlappingPendingBookings) {
          pending.status = BookingStatus.REJECTED;
        }
        await bookingRepository.save(overlappingPendingBookings);
      }
    }

    booking.status = nextStatus;
    return bookingRepository.save(booking);
  }



  async cancelBooking(userId: string, bookingId: string) {
    const booking = await findBookingById(bookingId);

    if (!booking) {
      throw new BookingModuleError("Booking not found", 404);
    }

    if (booking.userId !== userId) {
      throw new BookingModuleError("You are not allowed to cancel this booking", 403);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BookingModuleError("Booking is already cancelled", 400);
    }

    booking.status = BookingStatus.CANCELLED;
    return bookingRepository.save(booking);
  }

  async getUserBookings(userId: string, query: GetUserBookingHistoryDto) {
    await this.userRepository.getProfileOrFail(userId);

    return this.userRepository.getBookingHistory(userId, {
      page: query.page,
      limit: query.limit,
      status: query.status,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}

const bookingService = new BookingService();
export { bookingService };
