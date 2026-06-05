import { GetUserBookingHistoryDto } from "../dto/get-user-booking-history.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserModuleError } from "./user.error";
import { UserRepository } from "../repositories/user.repository";
import {
  PaginatedResult,
  BookingHistoryItem,
  UserProfileResponse,
} from "../models/user.types";

type UserProfileUpdates = {
  name?: string;
  email?: string;
  phone?: string | null;
  profileImage?: string | null;
};

const hasValue = <T>(value: T | undefined): value is T => value !== undefined;

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string): Promise<UserProfileResponse> {
    return this.userRepository.getProfileOrFail(userId);
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<UserProfileResponse> {
    const updates: UserProfileUpdates = {};

    if (hasValue(updateUserDto.name)) {
      updates.name = updateUserDto.name;
    }

    if (hasValue(updateUserDto.email)) {
      updates.email = updateUserDto.email.toLowerCase();
    }

    if (hasValue(updateUserDto.phone)) {
      updates.phone = updateUserDto.phone;
    }

    if (hasValue(updateUserDto.profileImage)) {
      updates.profileImage = updateUserDto.profileImage;
    }

    if (updates.email) {
      const existingUser = await this.userRepository.findByEmail(updates.email);

      if (existingUser && existingUser.id !== userId) {
        throw new UserModuleError("Email is already in use", 409);
      }
    }

    return this.userRepository.updateProfile(userId, updates);
  }

  async getBookingHistory(
    userId: string,
    query: GetUserBookingHistoryDto,
  ): Promise<PaginatedResult<BookingHistoryItem>> {
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
