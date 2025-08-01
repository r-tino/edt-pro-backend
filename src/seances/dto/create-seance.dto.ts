// src/seances/dto/create-seance.dto.ts
import { IsUUID, IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSeanceDto {
  @ApiProperty({
    description: "ID du niveau auquel cette séance est destinée.",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    format: 'uuid',
  })
  @IsUUID('4', { message: "Le niveauId doit être un UUID valide." })
  @IsNotEmpty({ message: "Le niveauId est obligatoire." })
  niveauId: string;

  @ApiProperty({
    description: "ID de l'enseignant qui donne cette séance.",
    example: "b2c3d4e5-f6a7-8901-2345-67890abcdef0",
    format: 'uuid',
  })
  @IsUUID('4', { message: "L'enseignantId doit être un UUID valide." })
  @IsNotEmpty({ message: "L'enseignantId est obligatoire." })
  enseignantId: string;

  @ApiProperty({
    description: "ID de la matière enseignée durant cette séance.",
    example: "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    format: 'uuid',
  })
  @IsUUID('4', { message: "La matiereId doit être un UUID valide." })
  @IsNotEmpty({ message: "La matiereId est obligatoire." })
  matiereId: string;

  @ApiProperty({
    description: "ID de la salle où se déroule cette séance.",
    example: "d4e5f6a7-b8c9-0123-4567-890abcdef345",
    format: 'uuid',
  })
  @IsUUID('4', { message: "La salleId doit être un UUID valide." })
  @IsNotEmpty({ message: "La salleId est obligatoire." })
  salleId: string;

  @ApiProperty({
    description: "Date précise de la séance (format YYYY-MM-DD).",
    example: "2025-07-04",
    format: "date",
  })
  @IsString()
  @IsNotEmpty({ message: "La date est obligatoire." })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "La date doit être au format YYYY-MM-DD." })
  date: string;

  @ApiProperty({
    description: "Heure de début de la séance (format HH:MM).",
    example: "08:00",
    format: 'string',
  })
  @IsString({ message: "L'heure de début doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "L'heure de début est obligatoire." })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "L'heure de début doit être au format HH:MM." })
  heureDebut: string; // Format HH:MM

  @ApiProperty({
    description: "Heure de fin de la séance (format HH:MM).",
    example: "10:00",
    format: 'string',
  })
  @IsString({ message: "L'heure de fin doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "L'heure de fin est obligatoire." })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "L'heure de fin doit être au format HH:MM." })
  heureFin: string; // Format HH:MM

  @ApiProperty({
    description: "Année scolaire de la séance (ex: '2024-2025').",
    example: "2024-2025",
  })
  @IsString({ message: "L'année scolaire doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "L'année scolaire est obligatoire." })
  anneeScolaire: string;

  @ApiProperty({
    description: "Semestre de la séance (ex: 'S1', 'S2').",
    example: "S1",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Le semestre doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le semestre ne peut pas être vide si fourni." })
  semestre?: string;
}