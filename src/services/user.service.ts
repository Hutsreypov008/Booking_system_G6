import { UserRepository } from '../repositories/user.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { RoomRepository } from '../repositories/room.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { User } from '../models/user.entity';
import { UpdateUserDto } from '../models/update-user.dto';
import { RegisterDto } from '../Authentication/register.dto';
import { AppError } from '../middlewares/error.middleware';
import { UserRole } from '../models/role.enum';
import { hashPassword } from '../utils/bcrypt';

export class UserService {
    private userRepository: UserRepository;
    private bookingRepository: BookingRepository;
    private roomRepository: RoomRepository;
    private refreshTokenRepository: RefreshTokenRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.bookingRepository = new BookingRepository();
        this.roomRepository = new RoomRepository();
        this.refreshTokenRepository = new RefreshTokenRepository();
    }

    async createUser(createUserDto: RegisterDto): Promise<Partial<User>> {
        const existingUser = await this.userRepository.findByEmail(createUserDto.email);
        
        if (existingUser) {
            throw new AppError('Email already registered', 409);
        }

        const passwordHash = await hashPassword(createUserDto.password);
        const user = await this.userRepository.create({
            name: createUserDto.name,
            email: createUserDto.email,
            passwordHash,
            phone: createUserDto.phone,
            role: createUserDto.role || UserRole.USER
        });

        const { passwordHash: _passwordHash, ...createdUser } = user;
        return createdUser;
    }

    async getProfile(userId: string): Promise<Partial<User>> {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const { passwordHash, ...profile } = user;
        return profile;
    }

    async updateProfile(userId: string, updateData: UpdateUserDto): Promise<Partial<User>> {
        await this.userRepository.update(userId, updateData);
        
        const updatedUser = await this.userRepository.findById(userId);
        if (!updatedUser) {
            throw new AppError('User not found', 404);
        }

        const { passwordHash, ...profile } = updatedUser;
        return profile;
    }

    async getBookingHistory(userId: string, page: number, limit: number) {
        const [bookings, total] = await this.bookingRepository.findByUser(userId, page, limit);
        return { bookings, total };
    }

    async getFavorites(userId: string, page: number, limit: number) {
        const [favorites, total] = await this.userRepository.getUserFavorites(userId, page, limit);
        return { favorites, total };
    }

    async addFavorite(userId: string, roomId: string) {
        const room = await this.roomRepository.findById(roomId);
        
        if (!room) {
            throw new AppError('Room not found', 404);
        }

        const isFavorite = await this.userRepository.isFavorite(userId, roomId);
        
        if (isFavorite) {
            throw new AppError('Room already in favorites', 409);
        }

        return await this.userRepository.addFavorite(userId, roomId);
    }

    async removeFavorite(userId: string, roomId: string) {
        const isFavorite = await this.userRepository.isFavorite(userId, roomId);
        
        if (!isFavorite) {
            throw new AppError('Room not found in favorites', 404);
        }

        await this.userRepository.removeFavorite(userId, roomId);
    }

    async deleteUser(targetUserId: string, requesterId: string, requesterRole: string) {
        const user = await this.userRepository.findById(targetUserId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const isSelfDelete = targetUserId === requesterId;
        const isOwnerDeletingSimpleUser = requesterRole === UserRole.OWNER && user.role === UserRole.USER && !isSelfDelete;
        const isOwnerDeletingOwner = requesterRole === UserRole.OWNER && user.role === UserRole.OWNER && !isSelfDelete;

        if (isOwnerDeletingOwner) {
            throw new AppError('Owners cannot delete other owners', 403);
        }

        if (!isSelfDelete && !isOwnerDeletingSimpleUser) {
            throw new AppError('Forbidden', 403);
        }

        const [ownedRooms] = await this.roomRepository.findByOwner(targetUserId, 1, 1);
        if (ownedRooms && ownedRooms.length > 0) {
            throw new AppError('User owns rooms. Delete or transfer them before deleting account', 400);
        }

        await this.bookingRepository.deleteByUser(targetUserId);
        await this.userRepository.deleteFavoritesByUser(targetUserId);
        await this.refreshTokenRepository.deleteByUserId(targetUserId);
        await this.userRepository.delete(targetUserId);
    }

    async getAllUsers(page: number, limit: number) {
        const [users, total] = await this.userRepository.findAll(page, limit);
        const usersWithoutPasswords = users.map(user => {
            const { passwordHash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        return { users: usersWithoutPasswords, total };
    }
}
