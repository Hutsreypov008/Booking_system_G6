import { Transform } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";

const normalizeOptionalText = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? null : trimmedValue;
};

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Transform(normalizeOptionalText)
  name?: string;

  @IsOptional()
  @IsEmail()
  @Transform(normalizeOptionalText)
  email?: string;

  @IsOptional()
  @Transform(normalizeOptionalText)
  @ValidateIf((_dto: UpdateUserDto, value: unknown) => value !== undefined && value !== null)
  @IsString()
  @Matches(/^[0-9+\-\s()]{6,20}$/)
  phone?: string | null;

  @IsOptional()
  @Transform(normalizeOptionalText)
  @ValidateIf((_dto: UpdateUserDto, value: unknown) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(2048)
  profileImage?: string | null;
}
