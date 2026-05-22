import { IsUUID, IsDateString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string;

    @IsDateString()
    @IsNotEmpty()
    @Transform(({ value }) => new Date(value))
    checkInDate: Date;

    @IsDateString()
    @IsNotEmpty()
    @Transform(({ value }) => new Date(value))
    checkOutDate: Date;
}