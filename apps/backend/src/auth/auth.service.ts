import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
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

  async validateUserById(userId: string): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toUserResponse(user);
  }

  private createAuthResponse(user: User): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: this.toUserResponse(user),
    };
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