import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  price?: string;
}