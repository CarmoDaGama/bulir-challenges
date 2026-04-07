import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const prismaMock = {
    transaction: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    user: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (callback: unknown) => {
      if (typeof callback === 'function') {
        return (callback as (tx: typeof prismaMock) => Promise<unknown>)(prismaMock as never);
      }

      return callback;
    }),
  } as unknown as PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(TransactionsService);
  });

  it('rejects client purchases when balance is insufficient', async () => {
    prismaMock.transaction.findUnique = jest.fn().mockResolvedValue(null);
    prismaMock.service.findUnique = jest.fn().mockResolvedValue({
      id: 'service-1',
      ownerId: 'provider-1',
      price: { toString: () => '50.00' },
    });
    prismaMock.user.updateMany = jest.fn().mockResolvedValue({ count: 0 });

    await expect(
      service.create(
        { userId: 'client-1', role: 'CLIENT' as never },
        { serviceId: 'service-1', idempotencyKey: 'idem-1' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});