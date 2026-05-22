import { GetUserBookingHistoryDto } from "../dto/get-user-booking-history.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserModuleError } from "../errors/user.error";
import { UserRepository } from "../repository/user.repository";
import {
  PaginatedResult,
  BookingHistoryItem,
  UserProfileResponse,
} from "../types/user.types";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string): Promise<UserProfileResponse> {
    return this.userRepository.getProfileOrFail(userId);
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<UserProfileResponse> {
    const updates = {
      ...(updateUserDto.name !== undefined ? { name: updateUserDto.name } : {}),
      ...(updateUserDto.email !== undefined ? { email: updateUserDto.email.toLowerCase() } : {}),
      ...(updateUserDto.phone !== undefined ? { phone: updateUserDto.phone } : {}),
      ...(updateUserDto.profileImage !== undefined
        ? { profileImage: updateUserDto.profileImage }
        : {}),
    };

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
