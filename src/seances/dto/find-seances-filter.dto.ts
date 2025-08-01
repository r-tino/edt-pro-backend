// src/seances/dto/find-seances-filter.dto.ts
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindSeancesFilterDto {
  @ApiPropertyOptional({
    description: "Filtrer par l'ID du niveau.",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: "Le niveauId doit être un UUID valide." })
  niveauId?: string;

  @ApiPropertyOptional({
    description: "Filtrer par l'ID de l'enseignant.",
    example: "b2c3d4e5-f6a7-8901-2345-67890abcdef0",
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'enseignantId doit être un UUID valide." })
  enseignantId?: string;

  @ApiPropertyOptional({
    description: "Filtrer par l'ID de la matière.",
    example: "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: "La matiereId doit être un UUID valide." })
  matiereId?: string;

  @ApiPropertyOptional({
    description: "Filtrer par l'ID de la salle.",
    example: "d4e5f6a7-b8c9-0123-4567-890abcdef345",
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: "La salleId doit être un UUID valide." })
  salleId?: string;

  @ApiPropertyOptional({
    description: "Filtrer par la date précise (format YYYY-MM-DD).",
    example: "2025-07-04",
    format: "date",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "La date doit être au format YYYY-MM-DD." })
  date?: string;

  @ApiPropertyOptional({
    description: "Filtrer par l'heure de début (format HH:MM).",
    example: "08:00",
    format: 'string',
  })
  @IsOptional()
  @IsString({ message: "L'heure de début doit être une chaîne de caractères." })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "L'heure de début doit être au format HH:MM." })
  heureDebut?: string;

  @ApiPropertyOptional({
    description: "Filtrer par l'heure de fin (format HH:MM).",
    example: "10:00",
    format: 'string',
  })
  @IsOptional()
  @IsString({ message: "L'heure de fin doit être une chaîne de caractères." })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "L'heure de fin doit être au format HH:MM." })
  heureFin?: string;

  @ApiPropertyOptional({
    description: "Filtrer par l'année scolaire (ex: '2024-2025').",
    example: "2024-2025",
  })
  @IsOptional()
  @IsString({ message: "L'année scolaire doit être une chaîne de caractères." })
  anneeScolaire?: string;

  @ApiPropertyOptional({
    description: "Filtrer par le semestre (ex: 'S1', 'S2').",
    example: "S1",
  })
  @IsOptional()
  @IsString({ message: "Le semestre doit être une chaîne de caractères." })
  semestre?: string;
}