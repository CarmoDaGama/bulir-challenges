import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesQueryDto } from './dto/list-services.query';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  list(@Query() query: ListServicesQueryDto) {
    return this.servicesService.list(query);
  }

  @Get('me')
  listMine(@CurrentUser() currentUser: { userId: string; role: UserRole }, @Query() query: ListServicesQueryDto) {
    return this.servicesService.listMine(currentUser, query);
  }

  @Roles(UserRole.PROVIDER)
  @Post()
  create(@CurrentUser() currentUser: { userId: string; role: UserRole }, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(currentUser, dto);
  }

  @Roles(UserRole.PROVIDER)
  @Put(':id')
  update(@CurrentUser() currentUser: { userId: string; role: UserRole }, @Param('id') serviceId: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(currentUser, serviceId, dto);
  }

  @Roles(UserRole.PROVIDER)
  @Delete(':id')
  remove(@CurrentUser() currentUser: { userId: string; role: UserRole }, @Param('id') serviceId: string) {
    return this.servicesService.remove(currentUser, serviceId);
  }
}