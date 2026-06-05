import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomType } from "../enums/room-type.enum";
import { Booking } from "./booking.entity";
import { RoomImage } from "./room-image.entity";
import { User } from "./user.entity";

@Entity("rooms")
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "owner_id", type: "varchar", length: 36 })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.rooms)
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 50 })
  type!: RoomType;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ name: "is_available", type: "boolean", default: true })
  isAvailable!: boolean;

  @OneToMany(() => RoomImage, (image) => image.room, {
    cascade: true,
  })
  images!: RoomImage[];

  @OneToMany(() => Booking, (booking) => booking.room)
  bookings!: Booking[];

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;
}
