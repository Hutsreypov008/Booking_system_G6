import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BookingStatus } from "../enums/booking-status.enum";

@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "room_id", type: "varchar", length: 36 })
  roomId!: string;

  @Column({ name: "user_id", type: "varchar", length: 36 })
  userId!: string;

  @Column({ type: "varchar", length: 50, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column({ name: "check_in_date", type: "date" })
  checkInDate!: string;

  @Column({ name: "check_out_date", type: "date" })
  checkOutDate!: string;

  @Column({ name: "total_price", type: "decimal", precision: 10, scale: 2 })
  totalPrice!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
