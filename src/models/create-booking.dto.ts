import { IsDate, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string;

    @IsDate()
    @IsNotEmpty()
    @Transform(({ value }) => new Date(value))
    checkInDate: Date;

    @IsDate()
    @IsNotEmpty()
    @Transform(({ value }) => new Date(value))
    checkOutDate: Date;
}
