import { IsString, IsNumber, Min, MaxLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { RoomType } from '../enums/room-type.enum';

export class CreateRoomDto {
    @IsString()
    @MaxLength(255)
    title!: string;

    @IsString()
    description!: string;

    @IsString()
    @MaxLength(255)
    location!: string;

    @IsEnum(RoomType)
    type!: RoomType;

    @IsNumber()
    @Min(0)
    price!: number;

    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;
}
