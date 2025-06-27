// src/auth/dto/register-enseignant-profile.dto.ts
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsArray,
  IsUUID,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class MatiereNiveauDto {
  @ApiProperty({ description: "ID de la matière enseignée.", example: "uuid-matiere-1" })
  @IsUUID('4', { message: "L'ID de la matière doit être un UUID valide." })
  matiereId: string;

  @ApiProperty({ description: "ID du niveau auquel la matière est enseignée.", example: "uuid-niveau-1" })
  @IsUUID('4', { message: "L'ID du niveau doit être un UUID valide." })
  niveauId: string;
}

export class RegisterEnseignantProfileDto {
  @ApiPropertyOptional({
    description: "Le poste de l'enseignant (ex: 'Chef de Département Informatique').",
    example: 'Chef de Département Informatique',
  })
  @IsOptional()
  @IsString({ message: "Le poste doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le poste ne peut pas être vide si fourni." })
  poste?: string;

  @ApiPropertyOptional({
    description: "Liste des matières enseignées par l'enseignant, avec le niveau pour chaque matière.",
    type: [MatiereNiveauDto],
  })
  @IsOptional()
  @IsArray({ message: "Les matières doivent être un tableau." })
  @ArrayNotEmpty({ message: "Le tableau des matières ne peut pas être vide." })
  @ValidateNested({ each: true })
  @Type(() => MatiereNiveauDto)
  matieresNiveaux?: MatiereNiveauDto[];
}