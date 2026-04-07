import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions.query';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  list(@CurrentUser() currentUser: { userId: string; role: UserRole }, @Query() query: ListTransactionsQueryDto) {
    return this.transactionsService.list(currentUser, query);
  }

  @Post()
  create(@CurrentUser() currentUser: { userId: string; role: UserRole }, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(currentUser, dto);
  }
}