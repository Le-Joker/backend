import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ChantiersService } from './chantiers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, User } from '../entities/user.entity';
import {
  CreateChantierDto,
  UpdateChantierDto,
  CreateChantierUpdateDto,
} from './dto/create-chantier.dto';
import { ChantierStatus } from '../entities/chantier.entity';

@Controller('chantiers')
@UseGuards(JwtAuthGuard)
export class ChantiersController {
  constructor(private chantiersService: ChantiersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async create(
    @Body(ValidationPipe) createChantierDto: CreateChantierDto,
    @Body('clientId') clientId: string,
  ) {
    return this.chantiersService.create(createChantierDto, clientId);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('statut') statut?: ChantierStatus,
  ) {
    const clientId = user.role === Role.CLIENT ? user.id : undefined;
    return this.chantiersService.findAll(clientId, statut);
  }

  @Get('stats')
  async getStatistics(@CurrentUser() user: User) {
    const clientId = user.role === Role.CLIENT ? user.id : undefined;
    return this.chantiersService.getStatistics(clientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.chantiersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateChantierDto: UpdateChantierDto,
    @CurrentUser() user: User,
  ) {
    return this.chantiersService.update(id, updateChantierDto, user.id);
  }

  @Put(':id/statut')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatut(
    @Param('id') id: string,
    @Body() body: { statut: ChantierStatus },
  ) {
    return this.chantiersService.updateStatut(id, body.statut);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT, Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.chantiersService.remove(id, user.id);
    return { message: 'Chantier supprimé avec succès' };
  }

  // ==========================================
  // ROUTES POUR LES MISES À JOUR
  // ==========================================

  @Post(':id/updates')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async createUpdate(
    @Param('id') chantierId: string,
    @Body(ValidationPipe) createUpdateDto: CreateChantierUpdateDto,
  ) {
    return this.chantiersService.createUpdate(chantierId, createUpdateDto);
  }

  @Get(':id/updates')
  async getUpdates(@Param('id') chantierId: string) {
    return this.chantiersService.getUpdates(chantierId);
  }

  @Delete('updates/:updateId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async removeUpdate(@Param('updateId') updateId: string) {
    await this.chantiersService.removeUpdate(updateId);
    return { message: 'Mise à jour supprimée avec succès' };
  }
}