import { Transform, Type } from "class-transformer";
import { IsDateString, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from "class-validator";

export class CreateBookingDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsNotEmpty()
  @IsUUID()
  roomId!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsNotEmpty()
  @IsDateString()
  checkInDate!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsNotEmpty()
  @IsDateString()
  checkOutDate!: string;

  @Type(() => Number)
  @IsNumber({}, { message: "totalPrice must be a numeric value" })
  @Min(0)
  totalPrice!: number;
}
