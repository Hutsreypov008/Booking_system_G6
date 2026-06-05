import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Role } from "../enums/role.enum";
import { Booking } from "./booking.entity";
import { Room } from "./room.entity";

@Entity({ name: "users" })
export class User {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255, select: false })
  passwordHash!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 20, default: Role.USER })
  role!: Role;

  @Column({ name: "profile_image", type: "text", nullable: true })
  profileImage!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @OneToMany(() => Room, (room) => room.owner)
  rooms!: Room[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings!: Booking[];
}
