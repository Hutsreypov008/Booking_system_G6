import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BookingStatus } from '../enums/booking-status.enum';

export class UpdateBookingDto {
    @IsUUID()
    @IsOptional()
    roomId?: string;

    @IsDate()
    @IsOptional()
    @Transform(({ value }) => new Date(value))
    checkInDate?: Date;

    @IsDate()
    @IsOptional()
    @Transform(({ value }) => new Date(value))
    checkOutDate?: Date;

    @IsEnum(BookingStatus)
    @IsOptional()
    status?: BookingStatus;
}
