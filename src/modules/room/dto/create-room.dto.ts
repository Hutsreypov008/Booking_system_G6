import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
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

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @Transform(({ value }) => normalizeRoomType(value))
  @IsEnum(RoomType)
  type!: RoomType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  isAvailable?: boolean;
}
