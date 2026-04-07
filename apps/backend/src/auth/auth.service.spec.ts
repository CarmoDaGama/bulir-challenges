import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwtService = {
    sign: jest.fn(() => 'signed-token'),
  } as unknown as JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('creates a signed auth response from a user', () => {
    const response = (service as unknown as { createAuthResponse: (user: unknown) => unknown }).createAuthResponse({
      id: 'user-1',
      name: 'User',
      email: 'user@example.com',
      nif: '123456789',
      role: 'CLIENT',
      balance: { toString: () => '25.00' },
      createdAt: new Date('2026-04-07T00:00:00.000Z'),
      updatedAt: new Date('2026-04-07T00:00:00.000Z'),
    } as never) as { accessToken: string; user: { email: string } };

    expect(response.accessToken).toBe('signed-token');
    expect(response.user.email).toBe('user@example.com');
  });
});