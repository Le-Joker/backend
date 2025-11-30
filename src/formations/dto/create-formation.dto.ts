import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { FormationLevel } from '../../entities/formation.entity';

export class CreateFormationDto {
  @IsString()
  titre: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsNumber()
  @Min(1)
  duree: number;

  @IsEnum(FormationLevel)
  niveau: FormationLevel;
}

export class UpdateFormationDto {
  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber()
  duree?: number;

  @IsOptional()
  @IsEnum(FormationLevel)
  niveau?: FormationLevel;
}

export class CreateModuleDto {
  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  ordre: number;
}

export class CreateLessonDto {
  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  contenu?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsNumber()
  @Min(0)
  duree: number;

  @IsNumber()
  ordre: number;
}