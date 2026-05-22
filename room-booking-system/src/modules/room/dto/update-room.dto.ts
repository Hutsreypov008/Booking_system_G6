import { IsString, IsNumber, Min, MaxLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { RoomType } from '../../../common/enums/room-type.enum';

export class UpdateRoomDto {
    @IsString()
    @MaxLength(255)
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    location?: string;

    @IsEnum(RoomType)
    @IsOptional()
    type?: RoomType;

    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number;

    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;
}