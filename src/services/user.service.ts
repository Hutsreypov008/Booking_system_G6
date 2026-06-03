import { GetUserBookingHistoryDto } from "../Authentication/dto/get-user-booking-history.dto";
import { UpdateUserDto } from "../Authentication/dto/update-user.dto";
import { UserModuleError } from "./user.error";
import { UserRepository } from "../repositories/user.repository";
import {
  PaginatedResult,
  BookingHistoryItem,
  UserProfileResponse,
} from "../models/user.types";
import { Role } from "../enums/role.enum";

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

  async getAllUsers(): Promise<UserProfileResponse[]> {
    return this.userRepository.findAll();
  }

  async deleteUser(requesterId: string, targetUserId: string): Promise<void> {
    const target = await this.userRepository.findById(targetUserId);

    if (!target) {
      throw new UserModuleError("User not found", 404);
    }

    if (target.id === requesterId) {
      throw new UserModuleError("Owners cannot delete themselves", 400);
    }

    if (target.role === Role.OWNER) {
      throw new UserModuleError("Cannot delete another owner", 403);
    }

    try {
      await this.userRepository.deleteById(targetUserId);
    } catch (error) {
      const err = error as { code?: string; errno?: number };
      if (err.errno === 1451 || err.code === "ER_ROW_IS_REFERENCED_2") {
        throw new UserModuleError(
          "Unable to delete user because related records exist. Clear dependent data first.",
          409,
        );
      }
      throw error;
    }
  }
}
