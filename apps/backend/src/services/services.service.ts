import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Service, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesQueryDto } from './dto/list-services.query';
import { UpdateServiceDto } from './dto/update-service.dto';

interface CurrentUserRef {
  userId: string;
  role: UserRole;
}

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUser: CurrentUserRef, dto: CreateServiceDto) {
    this.ensureProvider(currentUser.role);

    const service = await this.prisma.service.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        ownerId: currentUser.userId,
      },
      include: {
        owner: true,
      },
    });

    return this.toServiceResponse(service);
  }

  async list(query: ListServicesQueryDto) {
    const where = query.query
      ? {
          OR: [
            { title: { contains: query.query, mode: 'insensitive' as const } },
            { description: { contains: query.query, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.service.count({ where }),
      this.prisma.service.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: { owner: true },
      }),
    ]);

    return {
      items: items.map((service) => this.toServiceResponse(service)),
      meta: this.buildMeta(query.page, query.pageSize, total),
    };
  }

  async listMine(currentUser: CurrentUserRef, query: ListServicesQueryDto) {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.service.count({ where: { ownerId: currentUser.userId } }),
      this.prisma.service.findMany({
        where: { ownerId: currentUser.userId },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: { owner: true },
      }),
    ]);

    return {
      items: items.map((service) => this.toServiceResponse(service)),
      meta: this.buildMeta(query.page, query.pageSize, total),
    };
  }

  async update(currentUser: CurrentUserRef, serviceId: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    this.ensureOwnership(currentUser, service.ownerId);

    const updatedService = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.price ? { price: new Prisma.Decimal(dto.price) } : {}),
      },
      include: { owner: true },
    });

    return this.toServiceResponse(updatedService);
  }

  async remove(currentUser: CurrentUserRef, serviceId: string) {
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    this.ensureOwnership(currentUser, service.ownerId);

    await this.prisma.service.delete({ where: { id: serviceId } });

    return { deleted: true };
  }

  private ensureProvider(role: UserRole) {
    if (role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only providers can manage services');
    }
  }

  private ensureOwnership(currentUser: CurrentUserRef, ownerId: string) {
    this.ensureProvider(currentUser.role);

    if (currentUser.userId !== ownerId) {
      throw new ForbiddenException('Only the owner can modify this service');
    }
  }

  private toServiceResponse(service: Service & { owner?: { id: string; name: string; email: string; nif: string; role: UserRole; balance: Prisma.Decimal; createdAt: Date; updatedAt: Date } }) {
    return {
      id: service.id,
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      ownerId: service.ownerId,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
      owner: service.owner
        ? {
            id: service.owner.id,
            name: service.owner.name,
            email: service.owner.email,
            nif: service.owner.nif,
            role: service.owner.role,
            balance: service.owner.balance.toString(),
            createdAt: service.owner.createdAt.toISOString(),
            updatedAt: service.owner.updatedAt.toISOString(),
          }
        : undefined,
    };
  }

  private buildMeta(page: number, pageSize: number, total: number) {
    return {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}