import { BookingRepository } from '../repository/booking.repository';
import { RoomRepository } from '../../room/repository/room.repository';
import { UserRepository } from '../../users/repository/user.repository';
import { Booking } from '../entity/booking.entity';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingStatus } from '../../../common/enums/booking-status.enum';
import { AppError } from '../../../common/middleware/error.middleware';

export class BookingService {
    private bookingRepository: BookingRepository;
    private roomRepository: RoomRepository;
    private userRepository: UserRepository;

    constructor() {
        this.bookingRepository = new BookingRepository();
        this.roomRepository = new RoomRepository();
        this.userRepository = new UserRepository();
    }

    private calculateTotalPrice(pricePerNight: number, checkInDate: Date, checkOutDate: Date): number {
        const nights = Math.ceil(
            (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return pricePerNight * nights;
    }

    private async validateBookingDates(
        roomId: string,
        checkInDate: Date,
        checkOutDate: Date,
        excludeBookingId?: string
    ): Promise<void> {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (checkInDate < now) {
            throw new AppError('Check-in date cannot be in the past', 400);
        }

        if (checkOutDate <= checkInDate) {
            throw new AppError('Check-out date must be after check-in date', 400);
        }

        const conflictingBookings = await this.bookingRepository.findConflictingBookings(
            roomId,
            checkInDate,
            checkOutDate,
            excludeBookingId
        );

        if (conflictingBookings.length > 0) {
            throw new AppError('Room is not available for the selected dates', 409);
        }
    }

    async createBooking(userId: string, createBookingDto: CreateBookingDto): Promise<Booking> {
        const { roomId, checkInDate, checkOutDate } = createBookingDto;

        const room = await this.roomRepository.findById(roomId);
        if (!room) {
            throw new AppError('Room not found', 404);
        }

        if (!room.isAvailable) {
            throw new AppError('Room is currently unavailable', 400);
        }

        await this.validateBookingDates(roomId, checkInDate, checkOutDate);

        const totalPrice = this.calculateTotalPrice(
            Number(room.price),
            checkInDate,
            checkOutDate
        );

        const booking = await this.bookingRepository.create({
            userId,
            roomId,
            checkInDate,
            checkOutDate,
            totalPrice,
            status: BookingStatus.PENDING
        });

        console.log(JSON.stringify({
            level: 'INFO',
            message: 'New booking created',
            bookingId: booking.id,
            userId,
            roomId,
            timestamp: new Date().toISOString()
        }));

        return booking;
    }

    async getUserBookings(userId: string, page: number, limit: number): Promise<{ bookings: Booking[]; total: number }> {
        const [bookings, total] = await this.bookingRepository.findByUser(userId, page, limit);
        return { bookings, total };
    }

    async getOwnerBookings(ownerId: string, page: number, limit: number): Promise<{ bookings: Booking[]; total: number }> {
        const [bookings, total] = await this.bookingRepository.findByOwner(ownerId, page, limit);
        return { bookings, total };
    }

    async getBookingById(bookingId: string, userId: string, userRole: string): Promise<Booking> {
        const booking = await this.bookingRepository.findById(bookingId);
        
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        if (userRole !== 'OWNER' && booking.userId !== userId) {
            throw new AppError('You do not have permission to view this booking', 403);
        }

        if (userRole === 'OWNER' && booking.room.ownerId !== userId) {
            throw new AppError('You do not have permission to view this booking', 403);
        }

        return booking;
    }

    async getOwnerContact(bookingId: string, userId: string): Promise<{ name: string; phone: string; email: string }> {
        const booking = await this.bookingRepository.findById(bookingId);
        
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        if (booking.userId !== userId) {
            throw new AppError('You do not have permission to view this booking', 403);
        }

        if (booking.status !== BookingStatus.APPROVED) {
            throw new AppError('Owner contact is only available for approved bookings', 403);
        }

        const owner = booking.room.owner;
        
        return {
            name: owner.name,
            phone: owner.phone || 'Not provided',
            email: owner.email
        };
    }

    async approveBooking(bookingId: string, ownerId: string): Promise<Booking> {
        const booking = await this.bookingRepository.findById(bookingId);
        
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        if (booking.room.ownerId !== ownerId) {
            throw new AppError('You do not have permission to approve this booking', 403);
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new AppError(`Cannot approve booking with status: ${booking.status}`, 400);
        }

        await this.validateBookingDates(
            booking.roomId,
            booking.checkInDate,
            booking.checkOutDate,
            bookingId
        );

        await this.bookingRepository.updateStatus(bookingId, BookingStatus.APPROVED);
        
        const updatedBooking = await this.bookingRepository.findById(bookingId);

        console.log(JSON.stringify({
            level: 'INFO',
            message: 'Booking approved',
            bookingId,
            ownerId,
            roomId: booking.roomId,
            timestamp: new Date().toISOString()
        }));

        return updatedBooking!;
    }

    async rejectBooking(bookingId: string, ownerId: string): Promise<Booking> {
        const booking = await this.bookingRepository.findById(bookingId);
        
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        if (booking.room.ownerId !== ownerId) {
            throw new AppError('You do not have permission to reject this booking', 403);
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new AppError(`Cannot reject booking with status: ${booking.status}`, 400);
        }

        await this.bookingRepository.updateStatus(bookingId, BookingStatus.REJECTED);
        
        const updatedBooking = await this.bookingRepository.findById(bookingId);

        console.log(JSON.stringify({
            level: 'INFO',
            message: 'Booking rejected',
            bookingId,
            ownerId,
            roomId: booking.roomId,
            timestamp: new Date().toISOString()
        }));

        return updatedBooking!;
    }

    async cancelBooking(bookingId: string, userId: string): Promise<Booking> {
        const booking = await this.bookingRepository.findById(bookingId);
        
        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        if (booking.userId !== userId) {
            throw new AppError('You can only cancel your own bookings', 403);
        }

        if (booking.status === BookingStatus.CANCELLED) {
            throw new AppError('Booking is already cancelled', 400);
        }

        if (booking.status === BookingStatus.COMPLETED) {
            throw new AppError('Cannot cancel completed booking', 400);
        }

        if (booking.status === BookingStatus.REJECTED) {
            throw new AppError('Cannot cancel rejected booking', 400);
        }

        await this.bookingRepository.updateStatus(bookingId, BookingStatus.CANCELLED);
        
        const updatedBooking = await this.bookingRepository.findById(bookingId);

        console.log(JSON.stringify({
            level: 'INFO',
            message: 'Booking cancelled',
            bookingId,
            userId,
            roomId: booking.roomId,
            timestamp: new Date().toISOString()
        }));

        return updatedBooking!;
    }
}