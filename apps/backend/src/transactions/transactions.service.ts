import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions.query';

interface CurrentUserRef {
  userId: string;
  role: UserRole;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUser: CurrentUserRef, dto: CreateTransactionDto) {
    if (currentUser.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can create transactions');
    }

    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { service: true, client: true, provider: true },
    });

    if (existingTransaction) {
      return this.toTransactionResponse(existingTransaction);
    }

    return this.prisma.$transaction(async (tx) => {
      const service = await tx.service.findUnique({
        where: { id: dto.serviceId },
        include: { owner: true },
      });

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      const debitResult = await tx.user.updateMany({
        where: {
          id: currentUser.userId,
          balance: {
            gte: service.price,
          },
        },
        data: {
          balance: {
            decrement: service.price,
          },
        },
      });

      if (debitResult.count === 0) {
        throw new ConflictException('Insufficient balance');
      }

      await tx.user.update({
        where: { id: service.ownerId },
        data: {
          balance: {
            increment: service.price,
          },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          idempotencyKey: dto.idempotencyKey,
          amount: service.price,
          status: TransactionStatus.COMPLETED,
          type: TransactionType.PURCHASE,
          serviceId: service.id,
          clientId: currentUser.userId,
          providerId: service.ownerId,
        },
        include: {
          service: true,
          client: true,
          provider: true,
        },
      });

      return this.toTransactionResponse(transaction);
    });
  }

  async list(currentUser: CurrentUserRef, query: ListTransactionsQueryDto) {
    const where = {
      AND: [
        {
          OR: [{ clientId: currentUser.userId }, { providerId: currentUser.userId }],
        },
        query.from || query.to
          ? {
              createdAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {},
        query.status ? { status: query.status } : {},
        query.type ? { type: query.type } : {},
      ],
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          service: true,
          client: true,
          provider: true,
        },
      }),
    ]);

    return {
      items: items.map((transaction) => this.toTransactionResponse(transaction)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  private toTransactionResponse(transaction: {
    id: string;
    idempotencyKey: string;
    amount: Prisma.Decimal;
    status: TransactionStatus;
    type: TransactionType;
    createdAt: Date;
    service: {
      id: string;
      title: string;
      description: string;
      price: Prisma.Decimal;
      ownerId: string;
    };
    client: { id: string; name: string; email: string; nif: string; role: UserRole; balance: Prisma.Decimal; createdAt: Date; updatedAt: Date };
    provider: { id: string; name: string; email: string; nif: string; role: UserRole; balance: Prisma.Decimal; createdAt: Date; updatedAt: Date };
  }) {
    return {
      id: transaction.id,
      idempotencyKey: transaction.idempotencyKey,
      amount: transaction.amount.toString(),
      status: transaction.status,
      type: transaction.type,
      createdAt: transaction.createdAt.toISOString(),
      service: {
        id: transaction.service.id,
        title: transaction.service.title,
        description: transaction.service.description,
        price: transaction.service.price.toString(),
        ownerId: transaction.service.ownerId,
      },
      client: {
        id: transaction.client.id,
        name: transaction.client.name,
        email: transaction.client.email,
        nif: transaction.client.nif,
        role: transaction.client.role,
        balance: transaction.client.balance.toString(),
        createdAt: transaction.client.createdAt.toISOString(),
        updatedAt: transaction.client.updatedAt.toISOString(),
      },
      provider: {
        id: transaction.provider.id,
        name: transaction.provider.name,
        email: transaction.provider.email,
        nif: transaction.provider.nif,
        role: transaction.provider.role,
        balance: transaction.provider.balance.toString(),
        createdAt: transaction.provider.createdAt.toISOString(),
        updatedAt: transaction.provider.updatedAt.toISOString(),
      },
    };
  }
}