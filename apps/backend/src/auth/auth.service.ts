import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, AuthUserResponse } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { nif: dto.nif }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const balance = dto.balance ? new Prisma.Decimal(dto.balance) : new Prisma.Decimal(0);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        nif: dto.nif,
        passwordHash,
        role: dto.role,
        balance,
      },
    });

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { nif: dto.identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResponse(user);
  }

  async refresh(dto: RefreshDto): Promise<AuthResponse> {
    const tokenHash = this.hashRefreshToken(dto.refreshToken);
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !existingToken ||
      existingToken.revokedAt ||
      existingToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });

    return this.createAuthResponse(existingToken.user);
  }

  async validateUserById(userId: string): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toUserResponse(user);
  }

  private async createAuthResponse(user: User): Promise<AuthResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const refreshTtlMs = this.parseDurationToMs(
      process.env['REFRESH_TOKEN_EXPIRATION'] ?? '7d',
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshTtlMs),
      },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: this.toUserResponse(user),
    };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDurationToMs(input: string): number {
    const raw = input.trim();
    const match = raw.match(/^(\d+)([smhd])$/i);

    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const unitToMs: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return value * unitToMs[unit];
  }

  toUserResponse(user: User): AuthUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      nif: user.nif,
      role: user.role,
      balance: user.balance.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}