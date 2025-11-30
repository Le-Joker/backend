import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { PublicService } from './public.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, User } from '../entities/user.entity';
import { IsString, IsInt, Min, Max } from 'class-validator';

class CreateTestimonialDto {
  @IsString()
  contenu: string;

  @IsInt()
  @Min(1)
  @Max(5)
  note: number;
}

@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  // ========================================
  // ROUTES PUBLIQUES (sans authentification)
  // ========================================

  // GET /public/statistics - Récupérer les statistiques
  @Get('statistics')
  async getStatistics() {
    return this.publicService.getStatistics();
  }

  // GET /public/testimonials - Récupérer les témoignages approuvés
  @Get('testimonials')
  async getTestimonials() {
    return this.publicService.getTestimonials();
  }

  // ========================================
  // ROUTES PROTÉGÉES (authentification requise)
  // ========================================

  // POST /public/testimonials - Créer un témoignage
  @Post('testimonials')
  @UseGuards(JwtAuthGuard)
  async createTestimonial(
    @CurrentUser() user: User,
    @Body(ValidationPipe) dto: CreateTestimonialDto,
  ) {
    return this.publicService.createTestimonial(user.id, dto.contenu, dto.note);
  }

  // POST /public/testimonials/:id/approve - Approuver un témoignage (Admin)
  @Post('testimonials/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveTestimonial(@Param('id') id: string) {
    return this.publicService.approveTestimonial(id);
  }
}