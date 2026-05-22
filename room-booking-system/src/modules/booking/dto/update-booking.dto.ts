import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '../../../common/enums/booking-status.enum';

export class UpdateBookingDto {
    @IsEnum(BookingStatus)
    @IsOptional()
    status?: BookingStatus;
}