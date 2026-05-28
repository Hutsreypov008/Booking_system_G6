import { RoomRepository } from '../repositories/room.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { Room } from '../models/room.entity';
import { CreateRoomDto } from '../models/create-room.dto';
import { UpdateRoomDto } from '../models/update-room.dto';
import { SearchRoomDto } from '../models/search-room.dto';
import { AppError } from '../middlewares/error.middleware';
import { BookingStatus } from '../models/booking-status.enum';

export class RoomService {
    private roomRepository: RoomRepository;
    private bookingRepository: BookingRepository;

    constructor() {
        this.roomRepository = new RoomRepository();
        this.bookingRepository = new BookingRepository();
    }

    async searchRooms(searchParams: SearchRoomDto) {
        const page = searchParams.page || 1;
        const limit = searchParams.limit || 10;
        
        const [rooms, total] = await this.roomRepository.search(searchParams);
        
        return { rooms, total, page, limit };
    }

    async getRoomDetails(roomId: string): Promise<Room> {
        const room = await this.roomRepository.findById(roomId);
        
        if (!room) {
            throw new AppError('Room not found', 404);
        }
        
        return room;
    }

    async getAvailability(roomId: string, checkInDate?: Date, checkOutDate?: Date) {
        const room = await this.roomRepository.findById(roomId);
        
        if (!room) {
            throw new AppError('Room not found', 404);
        }

        let hasConflictingBooking = false;
        if (checkInDate && checkOutDate) {
            if (checkOutDate <= checkInDate) {
                throw new AppError('Check-out date must be after check-in date', 400);
            }

            const conflicts = await this.bookingRepository.findConflictingBookings(
                roomId,
                checkInDate,
                checkOutDate
            );
            hasConflictingBooking = conflicts.length > 0;
        }

        return {
            roomId: room.id,
            isAvailable: room.isAvailable && !hasConflictingBooking,
            roomAvailable: room.isAvailable,
            hasConflictingBooking
        };
    }

    async createRoom(ownerId: string, createRoomDto: CreateRoomDto): Promise<Room> {
        const room = await this.roomRepository.create({
            ...createRoomDto,
            ownerId
        });
        
        console.log(JSON.stringify({
            level: 'INFO',
            message: 'New room created',
            roomId: room.id,
            ownerId,
            datetime: new Date().toISOString()
        }));
        
        return room;
    }

    async getMyRooms(ownerId: string, page: number, limit: number) {
        const [rooms, total] = await this.roomRepository.findByOwner(ownerId, page, limit);
        return { rooms, total };
    }

    async updateRoom(roomId: string, ownerId: string, updateData: UpdateRoomDto): Promise<Room> {
        const room = await this.roomRepository.findById(roomId);
        
        if (!room) {
            throw new AppError('Room not found', 404);
        }
        
        if (room.ownerId !== ownerId) {
            throw new AppError('You do not have permission to update this room', 403);
        }
        
        await this.roomRepository.update(roomId, updateData);
        
        const updatedRoom = await this.roomRepository.findById(roomId);
        return updatedRoom!;
    }

    async deleteRoom(roomId: string, ownerId: string): Promise<void> {
        const room = await this.roomRepository.findById(roomId);
        
        if (!room) {
            throw new AppError('Room not found', 404);
        }
        
        if (room.ownerId !== ownerId) {
            throw new AppError('You do not have permission to delete this room', 403);
        }
        
        const activeBookings = room.bookings?.filter(
            booking => booking.status === BookingStatus.PENDING || booking.status === BookingStatus.APPROVED
        );
        
        if (activeBookings && activeBookings.length > 0) {
            throw new AppError('Cannot delete room with active bookings', 400);
        }
        
        await this.roomRepository.delete(roomId);
        
        console.log(JSON.stringify({
            level: 'INFO',
            message: 'Room deleted',
            roomId,
            ownerId,
            datetime: new Date().toISOString()
        }));
    }

    async toggleAvailability(roomId: string, ownerId: string): Promise<Room> {
        const room = await this.roomRepository.findById(roomId);
        
        if (!room) {
            throw new AppError('Room not found', 404);
        }
        
        if (room.ownerId !== ownerId) {
            throw new AppError('You do not have permission to modify this room', 403);
        }
        
        const newAvailability = !room.isAvailable;
        await this.roomRepository.updateAvailability(roomId, newAvailability);
        
        const updatedRoom = await this.roomRepository.findById(roomId);
        return updatedRoom!;
    }

    async uploadImage(roomId: string, ownerId: string, file: Express.Multer.File): Promise<any> {
        const room = await this.roomRepository.findById(roomId);
        
        if (!room) {
            throw new AppError('Room not found', 404);
        }
        
        if (room.ownerId !== ownerId) {
            throw new AppError('You do not have permission to upload images for this room', 403);
        }
        
        // For demo purposes, we'll use base64 encoding
        // In production, use Cloudinary or S3
        const base64Image = file.buffer.toString('base64');
        const imageUrl = `data:${file.mimetype};base64,${base64Image}`;
        
        const existingImages = await this.roomRepository.getImages(roomId);
        const order = existingImages.length;
        
        const image = await this.roomRepository.addImage(roomId, imageUrl, `temp_${Date.now()}`, order);
        
        return image;
    }

    async deleteImage(imageId: string, ownerId: string): Promise<void> {
        const image = await this.roomRepository.findImageById(imageId);
        
        if (!image) {
            throw new AppError('Image not found', 404);
        }
        
        const room = await this.roomRepository.findById(image.roomId);
        
        if (!room || room.ownerId !== ownerId) {
            throw new AppError('You do not have permission to delete this image', 403);
        }
        
        await this.roomRepository.deleteImage(imageId);
    }
}
