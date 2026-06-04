import { AppDataSource } from "../config/database";
import { Booking } from "../models/booking.entity";
import { OwnerBookingItem, OwnerBookingQuery } from "../models/booking.types";

export const bookingRepository = AppDataSource.getRepository(Booking);

interface OwnerBookingRow {
  id: string;
  roomId: string;
  userId: string;
  status: string;
  checkInDate: Date | string | null;
  checkOutDate: Date | string | null;
  totalPrice: string | number;
  createdAt: Date | string | null;
  roomTitle: string | null;
  roomLocation: string | null;
  roomPrice: string | number | null;
  userName: string | null;
  userEmail: string | null;
}

export const findBookingById = (bookingId: string): Promise<Booking | null> => {
  return bookingRepository.findOne({ where: { id: bookingId } });
};

export const createBooking = (booking: Partial<Booking>): Promise<Booking> => {
  return bookingRepository.save(bookingRepository.create(booking));
};

export const saveBooking = (booking: Booking): Promise<Booking> => {
  return bookingRepository.save(booking);
};

// Returns overlapping bookings for the same room that are still PENDING.
// Overlap rule (half-open interval): existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn
export const findOverlappingPendingBookingsByRoom = async (
  roomId: string,
  checkInDate: string,
  checkOutDate: string,
  excludeBookingId: string,
): Promise<Booking[]> => {
  return bookingRepository
    .createQueryBuilder("booking")
    .where("booking.room_id = :roomId", { roomId })
    .andWhere("booking.id != :excludeBookingId", { excludeBookingId })
    .andWhere("booking.status = :status", { status: "PENDING" })
    .andWhere("booking.check_in_date < :checkOutDate", { checkOutDate })
    .andWhere("booking.check_out_date > :checkInDate", { checkInDate })
    .getMany();
};


export const findBookingByIdForOwner = async (
  bookingId: string,
  ownerId: string,
): Promise<Booking | null> => {
  return bookingRepository
    .createQueryBuilder("booking")
    .innerJoin("rooms", "room", "room.id = booking.room_id")
    .where("booking.id = :bookingId", { bookingId })
    .andWhere("room.owner_id = :ownerId", { ownerId })
    .getOne();
};


export const getBookingsByOwner = async (
  ownerId: string,
  query: OwnerBookingQuery,
): Promise<{ data: OwnerBookingItem[]; meta: { totalItems: number; itemCount: number; itemsPerPage: number; totalPages: number; currentPage: number } }> => {
  const offset = (query.page - 1) * query.limit;
  const baseQuery = bookingRepository
    .createQueryBuilder("booking")
    .innerJoin("rooms", "room", "room.id = booking.room_id")
    .innerJoin("users", "user", "user.id = booking.user_id")
    .where("room.owner_id = :ownerId", { ownerId });

  if (query.status) {
    baseQuery.andWhere("booking.status = :status", { status: query.status });
  }

  const dataQuery = baseQuery
    .select([
      "booking.id AS id",
      "booking.room_id AS roomId",
      "booking.user_id AS userId",
      "booking.status AS status",
      "booking.check_in_date AS checkInDate",
      "booking.check_out_date AS checkOutDate",
      "booking.total_price AS totalPrice",
      "booking.created_at AS createdAt",
      "room.title AS roomTitle",
      "room.location AS roomLocation",
      "room.price AS roomPrice",
      "user.name AS userName",
      "user.email AS userEmail",
    ])
    .orderBy("booking.created_at", query.sortOrder)
    .offset(offset)
    .limit(query.limit);

  const countQuery = bookingRepository
    .createQueryBuilder("booking")
    .innerJoin("rooms", "room", "room.id = booking.room_id")
    .where("room.owner_id = :ownerId", { ownerId });

  if (query.status) {
    countQuery.andWhere("booking.status = :status", { status: query.status });
  }

  const [rows, countResult] = await Promise.all([
    dataQuery.getRawMany<OwnerBookingRow>(),
    countQuery.select("COUNT(booking.id)", "total").getRawOne<{ total: string | number }>(),
  ]);

  const totalItems = Number(countResult?.total ?? 0);

  return {
    data: rows.map((row) => ({
      id: row.id,
      roomId: row.roomId,
      userId: row.userId,
      status: row.status as any,
      checkInDate: row.checkInDate instanceof Date ? row.checkInDate.toISOString() : row.checkInDate,
      checkOutDate: row.checkOutDate instanceof Date ? row.checkOutDate.toISOString() : row.checkOutDate,
      totalPrice: Number(row.totalPrice),
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      roomTitle: row.roomTitle,
      roomLocation: row.roomLocation,
      roomPrice: row.roomPrice === null ? null : Number(row.roomPrice),
      userName: row.userName,
      userEmail: row.userEmail,
    })),
    meta: {
      totalItems,
      itemCount: rows.length,
      itemsPerPage: query.limit,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
      currentPage: query.page,
    },
  };
};
