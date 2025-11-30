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
import { FormationsService } from './formations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, User } from '../entities/user.entity';
import { FormationStatus } from '../entities/formation.entity';
import {
  CreateFormationDto,
  UpdateFormationDto,
  CreateModuleDto,
  CreateLessonDto,
} from './dto/create-formation.dto';

@Controller('formations')
export class FormationsController {
  constructor(private formationsService: FormationsService) {}

  // ==========================================
  // FORMATIONS
  // ==========================================

  @Get()
  async findAll(@Query('status') status?: FormationStatus) {
    return this.formationsService.findAll(status);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FORMATEUR)
  async getStatistics() {
    return this.formationsService.getStatistics();
  }

  @Get('my-formations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async getMyFormations(@CurrentUser() user: User) {
    return this.formationsService.findByFormateur(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.formationsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async create(
    @Body(ValidationPipe) createFormationDto: CreateFormationDto,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.create(createFormationDto, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateFormationDto: UpdateFormationDto,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.update(id, updateFormationDto, user.id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async publish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.formationsService.publish(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.formationsService.remove(id, user.id);
    return { message: 'Formation supprimée avec succès' };
  }

  // ==========================================
  // MODULES
  // ==========================================

  @Post(':formationId/modules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async createModule(
    @Param('formationId') formationId: string,
    @Body(ValidationPipe) createModuleDto: CreateModuleDto,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.createModule(
      formationId,
      createModuleDto,
      user.id,
    );
  }

  @Put('modules/:moduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async updateModule(
    @Param('moduleId') moduleId: string,
    @Body(ValidationPipe) updateData: Partial<CreateModuleDto>,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.updateModule(moduleId, updateData, user.id);
  }

  @Delete('modules/:moduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async removeModule(
    @Param('moduleId') moduleId: string,
    @CurrentUser() user: User,
  ) {
    await this.formationsService.removeModule(moduleId, user.id);
    return { message: 'Module supprimé avec succès' };
  }

  // ==========================================
  // LESSONS
  // ==========================================

  @Post('modules/:moduleId/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async createLesson(
    @Param('moduleId') moduleId: string,
    @Body(ValidationPipe) createLessonDto: CreateLessonDto,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.createLesson(
      moduleId,
      createLessonDto,
      user.id,
    );
  }

  @Put('lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body(ValidationPipe) updateData: Partial<CreateLessonDto>,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.updateLesson(lessonId, updateData, user.id);
  }

  @Delete('lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FORMATEUR)
  async removeLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
  ) {
    await this.formationsService.removeLesson(lessonId, user.id);
    return { message: 'Leçon supprimée avec succès' };
  }
}