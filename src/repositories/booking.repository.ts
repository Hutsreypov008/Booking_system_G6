import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Booking } from '../models/booking.entity';
import { BookingStatus } from '../enums/booking-status.enum';

export class BookingRepository {
    private repository: Repository<Booking>;

    constructor() {
        this.repository = AppDataSource.getRepository(Booking);
    }

    async create(bookingData: Partial<Booking>): Promise<Booking> {
        const booking = this.repository.create(bookingData);
        return await this.repository.save(booking);
    }

    async findById(id: string): Promise<Booking | null> {
        return await this.repository.findOne({
            where: { id },
            relations: {
                user: true,
                room: {
                    owner: true
                }
            }
        });
    }

    async findByUser(userId: string, page: number = 1, limit: number = 10): Promise<[Booking[], number]> {
        const [bookings, total] = await this.repository.findAndCount({
            where: { userId },
            relations: {
                room: true
            },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        });
        return [bookings, total];
    }

    async findByRoom(roomId: string): Promise<Booking[]> {
        return await this.repository.find({
            where: { roomId },
            relations: {
                user: true
            }
        });
    }

    async findByOwner(ownerId: string, page: number = 1, limit: number = 10): Promise<[Booking[], number]> {
        const [bookings, total] = await this.repository
            .createQueryBuilder('booking')
            .innerJoinAndSelect('booking.room', 'room')
            .innerJoinAndSelect('booking.user', 'user')
            .where('room.ownerId = :ownerId', { ownerId })
            .orderBy('booking.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        
        return [bookings, total];
    }

    async findAll(page: number = 1, limit: number = 10): Promise<[Booking[], number]> {
        return await this.repository.findAndCount({
            relations: {
                user: true,
                room: {
                    owner: true
                }
            },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        });
    }

    async findConflictingBookings(
        roomId: string,
        checkInDate: Date,
        checkOutDate: Date,
        excludeBookingId?: string,
        statuses: BookingStatus[] = [BookingStatus.APPROVED]
    ): Promise<Booking[]> {
        const query = this.repository
            .createQueryBuilder('booking')
            .where('booking.roomId = :roomId', { roomId })
            .andWhere('booking.status IN (:...statuses)', {
                statuses
            })
            .andWhere(
                '(booking.checkInDate < :checkOutDate AND booking.checkOutDate > :checkInDate)',
                { checkInDate, checkOutDate }
            );

        if (excludeBookingId) {
            query.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
        }

        return await query.getMany();
    }

    async expirePastBookings(referenceDate: Date = new Date()): Promise<void> {
        await this.repository
            .createQueryBuilder()
            .update(Booking)
            .set({ status: BookingStatus.EXPIRED })
            .where('status IN (:...statuses)', {
                statuses: [BookingStatus.PENDING, BookingStatus.APPROVED]
            })
            .andWhere('checkOutDate < :referenceDate', { referenceDate })
            .execute();
    }

    async updateStatus(id: string, status: BookingStatus): Promise<void> {
        await this.repository.update(id, { status });
    }

    async update(id: string, bookingData: Partial<Booking>): Promise<void> {
        await this.repository.update(id, bookingData);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async deleteByUser(userId: string): Promise<void> {
        await this.repository.delete({ userId });
    }

    async findByRoomAndDateRange(
        roomId: string,
        checkInDate: Date,
        checkOutDate: Date
    ): Promise<Booking[]> {
        return await this.repository.find({
            where: {
                roomId,
                status: BookingStatus.APPROVED
            }
        });
    }
}
