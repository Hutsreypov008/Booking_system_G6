import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Booking } from './booking.entity';
import { Room } from './room.entity';
import { Favorite } from './favorite.entity';
import { UserRole } from './role.enum';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255 })
    passwordHash: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Column({ name: 'profile_image', type: 'text', nullable: true })
    profileImage: string;

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt: Date;

    @OneToMany(() => Room, room => room.owner)
    rooms: Room[];

    @OneToMany(() => Booking, booking => booking.user)
    bookings: Booking[];

    @OneToMany(() => Favorite, favorite => favorite.user)
    favorites: Favorite[];
}