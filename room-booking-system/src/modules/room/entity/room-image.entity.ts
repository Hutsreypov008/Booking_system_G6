import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Room } from './room.entity';

@Entity('room_images')
export class RoomImage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'room_id', type: 'uuid' })
    roomId: string;

    @Column({ type: 'text' })
    url: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    publicId: string;

    @Column({ type: 'int', default: 0 })
    order: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Room, room => room.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room: Room;
}