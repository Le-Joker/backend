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
import { InscriptionsService } from './inscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, User } from '../entities/user.entity';
import { InscriptionStatus } from '../entities/inscription.entity';

@Controller('inscriptions')
@UseGuards(JwtAuthGuard)
export class InscriptionsController {
  constructor(private inscriptionsService: InscriptionsService) {}

  // Inscrire un étudiant à une formation
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ETUDIANT, Role.ADMIN)
  async inscrire(
    @Body() body: { formationId: string },
    @CurrentUser() user: User,
  ) {
    return this.inscriptionsService.inscrire(user.id, body.formationId);
  }

  // Récupérer les inscriptions d'un formateur
  @Get('formateur')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  async getInscriptionsFormateur(@CurrentUser() user: User) {
    return this.inscriptionsService.findByFormateur(user.id);
  }

  // Récupérer les inscriptions d'un étudiant
  @Get('etudiant')
  @UseGuards(RolesGuard)
  @Roles(Role.ETUDIANT)
  async getInscriptionsEtudiant(@CurrentUser() user: User) {
    return this.inscriptionsService.findByEtudiant(user.id);
  }

  // Statistiques formateur
  @Get('formateur/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR)
  async getStatisticsFormateur(@CurrentUser() user: User) {
    return this.inscriptionsService.getStatisticsFormateur(user.id);
  }

  // Étudiants par formation
  @Get('formation/:formationId/etudiants')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR, Role.ADMIN)
  async getEtudiantsParFormation(@Param('formationId') formationId: string) {
    return this.inscriptionsService.getEtudiantsParFormation(formationId);
  }

  // Récupérer une inscription
  @Get(':id')
  async getInscription(@Param('id') id: string) {
    return this.inscriptionsService.findOne(id);
  }

  // Mettre à jour la progression
  @Put(':id/progression')
  @UseGuards(RolesGuard)
  @Roles(Role.ETUDIANT, Role.FORMATEUR, Role.ADMIN)
  async updateProgression(
    @Param('id') id: string,
    @Body() body: { progression: number; modulesCompletes?: string[] },
  ) {
    return this.inscriptionsService.updateProgression(
      id,
      body.progression,
      body.modulesCompletes,
    );
  }

  // Mettre à jour le statut
  @Put(':id/statut')
  @UseGuards(RolesGuard)
  @Roles(Role.FORMATEUR, Role.ADMIN)
  async updateStatut(
    @Param('id') id: string,
    @Body() body: { statut: InscriptionStatus },
  ) {
    return this.inscriptionsService.updateStatut(id, body.statut);
  }

  // Marquer une leçon comme complétée
  @Post('progression/lesson')
  @UseGuards(RolesGuard)
  @Roles(Role.ETUDIANT)
  async markLessonComplete(
    @Body() body: { lessonId: string; tempsVisionne?: number; score?: number },
    @CurrentUser() user: User,
  ) {
    return this.inscriptionsService.markLessonComplete(
      user.id,
      body.lessonId,
      body.tempsVisionne,
      body.score,
    );
  }

  // Supprimer une inscription
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.inscriptionsService.remove(id);
    return { message: 'Inscription supprimée avec succès' };
  }
}