import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier!: string;

  @MinLength(8)
  password!: string;
}