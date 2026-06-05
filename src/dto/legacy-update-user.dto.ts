import { IsString, IsOptional, MinLength, MaxLength, IsEmail } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @IsOptional()
    name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    profileImage?: string;
}