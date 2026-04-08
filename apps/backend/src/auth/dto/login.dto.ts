import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^(([^\s@]+@[^\s@]+\.[^\s@]+)|(\d{9}))$/)
  identifier!: string;

  @MinLength(8)
  password!: string;
}