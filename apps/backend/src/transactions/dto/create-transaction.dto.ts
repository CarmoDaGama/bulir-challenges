import { IsString, MinLength } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  serviceId!: string;

  @IsString()
  @MinLength(8)
  idempotencyKey!: string;
}