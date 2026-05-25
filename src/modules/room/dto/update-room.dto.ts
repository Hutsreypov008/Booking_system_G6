import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { RoomType } from "../../../common/enums/room-type.enum";

const normalizeRoomType = (value: unknown): unknown => {
  return typeof value === "string"
    ? value.replace(/[^a-zA-Z]/g, "").toUpperCase()
    : value;
};

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeRoomType(value))
  @IsEnum(RoomType)
  type?: RoomType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  isAvailable?: boolean;
}
