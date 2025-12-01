import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { DevisType } from '../../entities/devis.entity';

export class CreateDevisDto {
  @IsString()
  titre: string;

  @IsString()
  description: string;

  @IsEnum(DevisType)
  type: DevisType;

  @IsString()
  adresseChantier: string;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFinEstimee?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class UpdateDevisDto {
  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  montant?: number;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFinEstimee?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}