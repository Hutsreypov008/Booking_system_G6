import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Booking } from './booking.entity';
import { RoomImage } from './room-image.entity';
import { Favorite } from './favorite.entity';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', length: 255 })
    location: string;

    @Column({ type: 'varchar', length: 50 })
    type: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ name: 'is_available', type: 'boolean', default: true })
    isAvailable: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt: Date;

    @ManyToOne(() => User, user => user.rooms)
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @OneToMany(() => Booking, booking => booking.room)
    bookings: Booking[];

    @OneToMany(() => RoomImage, image => image.room, { cascade: true })
    images: RoomImage[];

    @OneToMany(() => Favorite, favorite => favorite.room)
    favorites: Favorite[];
}