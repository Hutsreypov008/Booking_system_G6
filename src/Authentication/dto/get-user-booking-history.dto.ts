import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Max, Min } from "class-validator";

const bookingStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
const bookingSortFields = [
  "createdAt",
  "checkInDate",
  "checkOutDate",
  "status",
  "totalPrice",
] as const;
const sortDirections = ["ASC", "DESC"] as const;

export class GetUserBookingHistoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsIn(bookingStatuses)
  status?: (typeof bookingStatuses)[number];

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(bookingSortFields)
  sortBy: (typeof bookingSortFields)[number] = "createdAt";

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsIn(sortDirections)
  sortOrder: (typeof sortDirections)[number] = "DESC";
}
