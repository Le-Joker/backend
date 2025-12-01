import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsString({ message: 'Le prénom doit être une chaîne' })
  firstName: string;

  @IsString({ message: 'Le nom doit être une chaîne' })
  lastName: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Rôle invalide' })
  role?: UserRole;
}