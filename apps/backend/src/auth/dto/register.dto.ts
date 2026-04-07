import { IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsString()
  name!: string;

  @IsString()
  email!: string;

  @IsString()
  nif!: string;

  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  balance?: string;
}