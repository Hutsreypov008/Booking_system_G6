import { Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsString } from "class-validator";
import { BookingStatus } from "../../enums/booking-status.enum";

const bookingResponseStatuses = [
  BookingStatus.APPROVED,
  BookingStatus.REJECTED,
] as const;

export class UpdateBookingDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsNotEmpty()
  @IsString()
  @IsIn(bookingResponseStatuses)
  status!: BookingStatus;
}
