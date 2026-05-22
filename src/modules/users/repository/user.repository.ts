import { DataSource, Repository } from "typeorm";
import { UserModuleError } from "../errors/user.error";
import { User } from "../entity/user.entity";
import {
  BookingHistoryItem,
  BookingHistoryQuery,
  PaginatedResult,
  UserProfileResponse,
} from "../types/user.types";

interface BookingHistoryRow {
  id: string;
  roomId: string | null;
  status: string;
  checkInDate: Date | string | null;
  checkOutDate: Date | string | null;
  totalPrice: string | number;
  createdAt: Date | string | null;
  roomTitle: string | null;
  roomLocation: string | null;
  roomType: string | null;
  roomPrice: string | number | null;
  roomAvailable: boolean | number | null;
}

type UserProfileUpdate = Partial<Pick<User, "name" | "email" | "phone" | "profileImage">>;

export class UserRepository {
  constructor(private readonly userRepository: Repository<User>) {}

  static fromDataSource(dataSource: DataSource): UserRepository {
    return new UserRepository(dataSource.getRepository(User));
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email })
      .getOne();
  }

  create(payload: Partial<User>): User {
    return this.userRepository.create(payload);
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(userId, { passwordHash });
  }

  async getProfileOrFail(userId: string): Promise<UserProfileResponse> {
    const user = await this.findById(userId);

    if (!user) {
      throw new UserModuleError("User profile not found", 404);
    }

    return this.mapUserToProfile(user);
  }

  async updateProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfileResponse> {
    const existingUser = await this.findById(userId);

    if (!existingUser) {
      throw new UserModuleError("User profile not found", 404);
    }

    await this.userRepository.update(userId, updates);

    const updatedUser = await this.findById(userId);

    if (!updatedUser) {
      throw new UserModuleError("User profile not found after update", 404);
    }

    return this.mapUserToProfile(updatedUser);
  }

  async getBookingHistory(
    userId: string,
    query: BookingHistoryQuery,
  ): Promise<PaginatedResult<BookingHistoryItem>> {
    const offset = (query.page - 1) * query.limit;
    const sortColumns: Record<BookingHistoryQuery["sortBy"], string> = {
      createdAt: "booking.created_at",
      checkInDate: "booking.check_in_date",
      checkOutDate: "booking.check_out_date",
      status: "booking.status",
      totalPrice: "booking.total_price",
    };

    const dataQuery = this.createBookingHistoryBaseQuery(userId, query)
      .select([
        "booking.id AS id",
        "booking.room_id AS roomId",
        "booking.status AS status",
        "booking.check_in_date AS checkInDate",
        "booking.check_out_date AS checkOutDate",
        "booking.total_price AS totalPrice",
        "booking.created_at AS createdAt",
        "room.title AS roomTitle",
        "room.location AS roomLocation",
        "room.type AS roomType",
        "room.price AS roomPrice",
        "room.is_available AS roomAvailable",
      ])
      .orderBy(sortColumns[query.sortBy], query.sortOrder)
      .offset(offset)
      .limit(query.limit);

    const countQuery = this.createBookingHistoryBaseQuery(userId, query).select(
      "COUNT(booking.id)",
      "total",
    );

    const [rows, countResult] = await Promise.all([
      dataQuery.getRawMany<BookingHistoryRow>(),
      countQuery.getRawOne<{ total: string | number }>(),
    ]);

    const totalItems = Number(countResult?.total ?? 0);

    return {
      data: rows.map((row: BookingHistoryRow) => this.mapBookingRow(row)),
      meta: {
        totalItems,
        itemCount: rows.length,
        itemsPerPage: query.limit,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
        currentPage: query.page,
      },
    };
  }

  private createBookingHistoryBaseQuery(userId: string, query: BookingHistoryQuery) {
    const queryBuilder = this.userRepository.manager
      .createQueryBuilder()
      .from("bookings", "booking")
      .leftJoin("rooms", "room", "room.id = booking.room_id")
      .where("booking.user_id = :userId", { userId });

    if (query.status) {
      queryBuilder.andWhere("booking.status = :status", { status: query.status });
    }

    if (query.search) {
      queryBuilder.andWhere(
        "(LOWER(room.title) LIKE LOWER(:search) OR LOWER(room.location) LIKE LOWER(:search) OR LOWER(room.type) LIKE LOWER(:search))",
        { search: `%${query.search}%` },
      );
    }

    return queryBuilder;
  }

  private mapUserToProfile(user: User): UserProfileResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  }

  private mapBookingRow(row: BookingHistoryRow): BookingHistoryItem {
    return {
      id: row.id,
      roomId: row.roomId,
      status: row.status,
      checkInDate: this.formatDateValue(row.checkInDate),
      checkOutDate: this.formatDateValue(row.checkOutDate),
      totalPrice: Number(row.totalPrice),
      createdAt: this.formatDateValue(row.createdAt),
      roomTitle: row.roomTitle,
      roomLocation: row.roomLocation,
      roomType: row.roomType,
      roomPrice: row.roomPrice === null ? null : Number(row.roomPrice),
      roomAvailable:
        row.roomAvailable === null ? null : Boolean(Number(row.roomAvailable)),
    };
  }

  private formatDateValue(value: Date | string | null): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return value;
  }
}
