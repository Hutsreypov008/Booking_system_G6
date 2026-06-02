import { BookingRepository } from '../repositories/booking.repository';
import { RoomRepository } from '../repositories/room.repository';
import { UserRepository } from '../repositories/user.repository';
import { Booking } from '../models/booking.entity';
import { CreateBookingDto } from '../models/create-booking.dto';
import { UpdateBookingDto } from '../models/update-booking.dto';
import { BookingStatus } from '../models/booking-status.enum';
import { AppError } from '../middlewares/error.middleware';

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

        // Prevent room owners from booking their own rooms
        if (room.ownerId === userId) {
            throw new AppError('You cannot book your own room', 403);
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
            datetime: new Date().toISOString()
        }));

        return booking;
    }

    private async expirePastBookings(): Promise<void> {
        await this.bookingRepository.expirePastBookings();
    }

    async getUserBookings(userId: string, page: number, limit: number): Promise<{ bookings: Booking[]; total: number }> {
        await this.expirePastBookings();
        const [bookings, total] = await this.bookingRepository.findByUser(userId, page, limit);
        return { bookings, total };
    }

    async getOwnerBookings(ownerId: string, page: number, limit: number): Promise<{ bookings: Booking[]; total: number }> {
        await this.expirePastBookings();
        const [bookings, total] = await this.bookingRepository.findByOwner(ownerId, page, limit);
        return { bookings, total };
    }

    async getBookings(userId: string, userRole: string, page: number, limit: number): Promise<{ bookings: Booking[]; total: number }> {
        await this.expirePastBookings();
        if (userRole === 'OWNER') {
            return await this.getOwnerBookings(userId, page, limit);
        }

        return await this.getUserBookings(userId, page, limit);
    }

    async getBookingById(bookingId: string, userId: string, userRole: string): Promise<Booking> {
        await this.expirePastBookings();
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

    async updateBooking(
        bookingId: string,
        userId: string,
        userRole: string,
        updateData: UpdateBookingDto
    ): Promise<Booking> {
        await this.expirePastBookings();
        const booking = await this.bookingRepository.findById(bookingId);

        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        const isOwner = userRole === 'OWNER' && booking.room.ownerId === userId;
        const isUser = booking.userId === userId;

        if (!isOwner && !isUser) {
            throw new AppError('You do not have permission to update this booking', 403);
        }

        if (booking.status === BookingStatus.EXPIRED) {
            throw new AppError('Expired bookings cannot be modified', 400);
        }

        if (booking.status === BookingStatus.CANCELLED) {
            throw new AppError('Cancelled bookings cannot be modified', 400);
        }

        if (
            updateData.roomId === undefined &&
            updateData.checkInDate === undefined &&
            updateData.checkOutDate === undefined &&
            updateData.status === undefined
        ) {
            throw new AppError('No booking fields provided to update', 400);
        }

        if (isUser && booking.status !== BookingStatus.PENDING &&
            (updateData.roomId || updateData.checkInDate || updateData.checkOutDate)) {
            throw new AppError('Only pending bookings can be edited by the booking user', 400);
        }

        if (isOwner && (updateData.roomId || updateData.checkInDate || updateData.checkOutDate)) {
            throw new AppError('Only the booking user can update booking details', 403);
        }

        const nextRoomId = updateData.roomId || booking.roomId;
        const nextCheckInDate = updateData.checkInDate || booking.checkInDate;
        const nextCheckOutDate = updateData.checkOutDate || booking.checkOutDate;
        const updatePayload: Partial<Booking> = {};

        if (updateData.roomId || updateData.checkInDate || updateData.checkOutDate) {
            const room = await this.roomRepository.findById(nextRoomId);
            if (!room) {
                throw new AppError('Room not found', 404);
            }

            if (!room.isAvailable) {
                throw new AppError('Room is currently unavailable', 400);
            }

            await this.validateBookingDates(nextRoomId, nextCheckInDate, nextCheckOutDate, bookingId);

            updatePayload.roomId = nextRoomId;
            updatePayload.checkInDate = nextCheckInDate;
            updatePayload.checkOutDate = nextCheckOutDate;
            updatePayload.totalPrice = this.calculateTotalPrice(
                Number(room.price),
                nextCheckInDate,
                nextCheckOutDate
            );
        }

        if (updateData.status) {
            if (!isUser || updateData.status !== BookingStatus.CANCELLED) {
                throw new AppError('Status can only be changed to CANCELLED by the booking user', 403);
            }

            updatePayload.status = BookingStatus.CANCELLED;
        }

        await this.bookingRepository.update(bookingId, updatePayload);

        const updatedBooking = await this.bookingRepository.findById(bookingId);
        return updatedBooking!;
    }

    async deleteBooking(bookingId: string, userId: string, userRole: string): Promise<void> {
        await this.expirePastBookings();
        const booking = await this.bookingRepository.findById(bookingId);

        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        const isOwner = userRole === 'OWNER' && booking.room.ownerId === userId;
        const isUser = booking.userId === userId;

        if (!isOwner && !isUser) {
            throw new AppError('You do not have permission to delete this booking', 403);
        }

        await this.bookingRepository.delete(bookingId);
    }

    async getOwnerContact(bookingId: string, userId: string): Promise<{ name: string; phone: string; email: string }> {
        await this.expirePastBookings();
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
        await this.expirePastBookings();
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

        // Approve the booking
        await this.bookingRepository.updateStatus(bookingId, BookingStatus.APPROVED);

        // Fetch the updated booking
        const updatedBooking = await this.bookingRepository.findById(bookingId);

        // Find and reject all conflicting pending bookings for the same room/date range
        const pendingConflicts = await this.bookingRepository.findConflictingBookings(
            booking.roomId,
            booking.checkInDate,
            booking.checkOutDate,
            bookingId,
            [BookingStatus.PENDING]
        );

        for (const pending of pendingConflicts) {
            await this.bookingRepository.updateStatus(pending.id, BookingStatus.REJECTED);
            console.log(JSON.stringify({
                level: 'INFO',
                message: 'Pending booking rejected due to conflicting approval',
                bookingId: pending.id,
                conflictedWith: bookingId,
                datetime: new Date().toISOString()
            }));
        }

        console.log(JSON.stringify({
            level: 'INFO',
            message: 'Booking approved',
            bookingId,
            ownerId,
            roomId: booking.roomId,
            datetime: new Date().toISOString()
        }));

        return updatedBooking!;
    }

    async rejectBooking(bookingId: string, ownerId: string): Promise<Booking> {
        await this.expirePastBookings();
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
            datetime: new Date().toISOString()
        }));

        return updatedBooking!;
    }

    async cancelBooking(bookingId: string, userId: string): Promise<Booking> {
        await this.expirePastBookings();
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

        if (booking.status === BookingStatus.EXPIRED) {
            throw new AppError('Cannot cancel expired booking', 400);
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
            datetime: new Date().toISOString()
        }));

        return updatedBooking!;
    }
}
