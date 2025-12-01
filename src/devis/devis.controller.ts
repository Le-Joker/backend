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
import { DevisService } from './devis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, User } from '../entities/user.entity';
import { CreateDevisDto, UpdateDevisDto } from './dto/create-devis.dto';
import { DevisStatus } from '../entities/devis.entity';

@Controller('devis')
@UseGuards(JwtAuthGuard)
export class DevisController {
  constructor(private devisService: DevisService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  async create(
    @Body(ValidationPipe) createDevisDto: CreateDevisDto,
    @CurrentUser() user: User,
  ) {
    return this.devisService.create(createDevisDto, user.id);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('statut') statut?: DevisStatus,
  ) {
    // Si CLIENT, voir seulement ses devis
    // Si ADMIN, voir tous les devis
    const clientId = user.role === Role.CLIENT ? user.id : undefined;
    return this.devisService.findAll(clientId, statut);
  }

  @Get('stats')
  async getStatistics(@CurrentUser() user: User) {
    const clientId = user.role === Role.CLIENT ? user.id : undefined;
    return this.devisService.getStatistics(clientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.devisService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDevisDto: UpdateDevisDto,
    @CurrentUser() user: User,
  ) {
    return this.devisService.update(id, updateDevisDto, user.id);
  }

  @Put(':id/statut')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatut(
    @Param('id') id: string,
    @Body() body: { statut: DevisStatus; montant?: number },
  ) {
    return this.devisService.updateStatut(id, body.statut, body.montant);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT, Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.devisService.remove(id, user.id);
    return { message: 'Devis supprimé avec succès' };
  }
}