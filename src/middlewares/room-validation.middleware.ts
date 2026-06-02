import { NextFunction, Request, Response } from "express";
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
import { RoomType } from "../enums/room-type.enum";
import { validateBody } from "./validation.middleware";

const normalizeRoomTypeValue = (value: unknown): unknown => {
  return typeof value === "string" ? value.replace(/[^a-zA-Z]/g, "").toUpperCase() : value;
};

class CreateRoomRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @Transform(({ value }) => normalizeRoomTypeValue(value))
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

class UpdateRoomRequest {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeRoomTypeValue(value))
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

class UpdateRoomAvailabilityRequest {
  @Transform(({ value }) => value === true || value === "true" || value === 1 || value === "1")
  @IsBoolean()
  isAvailable!: boolean;
}

export const normalizeRoomBody = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body.isAvailable === undefined && req.body.is_available !== undefined) {
    req.body.isAvailable = req.body.is_available;
  }

  next();
};

export const validateCreateRoom = validateBody(CreateRoomRequest);
export const validateUpdateRoom = validateBody(UpdateRoomRequest);
export const validateUpdateAvailability = validateBody(UpdateRoomAvailabilityRequest);
