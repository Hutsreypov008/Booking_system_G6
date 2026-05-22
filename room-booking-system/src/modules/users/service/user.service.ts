import { UserRepository } from '../repository/user.repository';
import { BookingRepository } from '../../booking/repository/booking.repository';
import { RoomRepository } from '../../room/repository/room.repository';
import { User } from '../entity/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AppError } from '../../../common/middleware/error.middleware';
import { BookingStatus } from '../../../common/enums/booking-status.enum';

export class UserService {
    private userRepository: UserRepository;
    private bookingRepository: BookingRepository;
    private roomRepository: RoomRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.bookingRepository = new BookingRepository();
        this.roomRepository = new RoomRepository();
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
}