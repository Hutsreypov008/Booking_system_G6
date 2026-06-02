import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { BookingStatus } from './booking-status.enum';
import { User } from './user.entity';
import { Room } from './room.entity';

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'room_id', type: 'uuid' })
    roomId: string;

    @Column({ name: 'check_in_date', type: 'datetime' })
    checkInDate: Date;

    @Column({ name: 'check_out_date', type: 'datetime' })
    checkOutDate: Date;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING
    })
    status: BookingStatus;

    @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
    totalPrice: number;

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt: Date;

    @ManyToOne(() => User, user => user.bookings)
    @JoinColumn({ name: 'user_id' })
    user: User;
    
    @ManyToOne(() => Room, room => room.bookings)
    @JoinColumn({ name: 'room_id' })
    room: Room;
}