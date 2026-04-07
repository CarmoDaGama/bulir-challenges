import { IsString, Matches, MinLength } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @Matches(/^\d+(\.\d{1,2})?$/)
  price!: string;
}