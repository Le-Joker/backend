import { IsString, IsNumber, IsDateString, IsOptional, Min, Max } from 'class-validator';

export class CreateChantierDto {
  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  adresse: string;

  @IsDateString()
  dateDebut: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  image?: string;
}

export class UpdateChantierDto {
  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progression?: number;

  @IsOptional()
  @IsNumber()
  budget?: number;
}

export class CreateChantierUpdateDto {
  @IsString()
  titre: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progression?: number;
}