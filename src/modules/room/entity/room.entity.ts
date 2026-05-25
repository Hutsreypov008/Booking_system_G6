import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomType } from "../../../common/enums/room-type.enum";
import { RoomImage } from "./room-image.entity";

@Entity("rooms")
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "owner_id", type: "varchar", length: 36 })
  ownerId!: string;

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

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;
}
