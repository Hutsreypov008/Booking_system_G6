import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';

@Entity('favorites')
export class Favorite {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'room_id', type: 'uuid' })
    roomId: string;

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt: Date;

    @ManyToOne(() => User, user => user.favorites)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Room, room => room.favorites)
    @JoinColumn({ name: 'room_id' })
    room: Room;
}