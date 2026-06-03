import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Room } from "./room.entity";

@Entity("room_images")
export class RoomImage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "room_id", type: "char", length: 36 })
  roomId!: string;

  @Column({ name: "url", type: "text" })
  url!: string;

  @Column({ name: "publicId", type: "varchar", length: 255, nullable: true })
  publicId?: string;

  @Column({ name: "order", type: "int", default: 0 })
  order!: number;

  @ManyToOne(() => Room, (room) => room.images, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;
}
