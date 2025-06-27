// src/seances/dto/update-seance.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateSeanceDto } from './create-seance.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty, IsEnum, Matches, IsOptional } from 'class-validator';
import { Jour } from '@prisma/client';

export class UpdateSeanceDto extends PartialType(CreateSeanceDto) {
  // Tous les champs hérités de CreateSeanceDto deviennent optionnels grâce à PartialType.
  // Vous pouvez ajouter ici des validations plus spécifiques si nécessaire
  // pour les champs mis à jour, ou des champs qui n'étaient pas dans CreateSeanceDto.

  @ApiPropertyOptional({
    description: "Nouvel ID du niveau.",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: "Le niveauId doit être un UUID valide." })
  niveauId?: string;

  @ApiPropertyOptional({
    description: "Nouvel ID de l'enseignant.",
    example: "b2c3d4e5-f6a7-8901-2345-67890abcdef0",
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'enseignantId doit être un UUID valide." })
  enseignantId?: string;

  @ApiPropertyOptional({
    description: "Nouvel ID de la matière.",
    example: "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: "La matiereId doit être un UUID valide." })
  matiereId?: string;

  @ApiPropertyOptional({
    description: "Nouvel ID de la salle.",
    example: "d4e5f6a7-b8c9-0123-4567-890abcdef345",
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: "La salleId doit être un UUID valide." })
  salleId?: string;

  @ApiPropertyOptional({
    description: "Nouveau jour de la semaine.",
    enum: Jour,
    example: Jour.MARDI,
  })
  @IsOptional()
  @IsEnum(Jour, { message: "Le jour doit être une valeur valide (LUNDI, MARDI, MERCREDI, JEUDI, VENDREDI, SAMEDI)." })
  jour?: Jour;

  @ApiPropertyOptional({
    description: "Nouvelle heure de début (format HH:MM).",
    example: "10:00",
    format: 'string',
  })
  @IsOptional()
  @IsString({ message: "L'heure de début doit être une chaîne de caractères." })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "L'heure de début doit être au format HH:MM." })
  heureDebut?: string;

  @ApiPropertyOptional({
    description: "Nouvelle heure de fin (format HH:MM).",
    example: "12:00",
    format: 'string',
  })
  @IsOptional()
  @IsString({ message: "L'heure de fin doit être une chaîne de caractères." })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "L'heure de fin doit être au format HH:MM." })
  heureFin?: string;

  @ApiPropertyOptional({
    description: "Nouvelle année scolaire.",
    example: "2025-2026",
  })
  @IsOptional()
  @IsString({ message: "L'année scolaire doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "L'année scolaire ne peut pas être vide si fournie." })
  anneeScolaire?: string;

  @ApiPropertyOptional({
    description: "Nouveau semestre.",
    example: "S2",
  })
  @IsOptional()
  @IsString({ message: "Le semestre doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le semestre ne peut pas être vide si fourni." })
  semestre?: string;
}