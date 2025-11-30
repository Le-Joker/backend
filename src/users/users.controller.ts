import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../entities/user.entity';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { SubmitTestDto } from './dto/submit-test.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ========================================
  // CRUD USERS
  // ========================================

  // GET /users - Liste tous les utilisateurs (Admin uniquement)
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  // GET /users/:id - Récupérer un utilisateur
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // PUT /users/:id - Mettre à jour un utilisateur
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    // Un utilisateur ne peut mettre à jour que son propre profil, sauf si Admin
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new Error('Vous ne pouvez modifier que votre propre profil');
    }

    return this.usersService.update(id, updateUserDto);
  }

  // DELETE /users/:id - Supprimer un utilisateur (Admin uniquement)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Utilisateur supprimé avec succès' };
  }

  // ========================================
  // TEST FORMATEUR
  // ========================================

  // GET /users/test-formateur/questions - Récupérer les questions du test
  @Get('test-formateur/questions')
  getTestQuestions() {
    return this.usersService.getTestQuestions();
  }

  // POST /users/test-formateur/submit - Soumettre le test
  @Post('test-formateur/submit')
  async submitTest(
    @CurrentUser() user: User,
    @Body(ValidationPipe) submitTestDto: SubmitTestDto,
  ) {
    return this.usersService.submitTest(user.id, submitTestDto);
  }

  // GET /users/test-formateur/result - Récupérer le résultat du test
  @Get('test-formateur/result')
  async getTestResult(@CurrentUser() user: User) {
    return this.usersService.getTestResult(user.id);
  }
}