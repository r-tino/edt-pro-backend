// src/matieres/dto/create-matiere.dto.ts
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMatiereDto {
  @ApiProperty({
    description: 'Nom de la matière (ex: Algorithmique, Probabilités)',
    example: 'Algorithmique',
  })
  @IsString({ message: 'Le nom de la matière doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom de la matière ne peut pas être vide.' })
  nom: string;

  @ApiProperty({
    description: 'ID du niveau auquel cette matière est associée',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', // Exemple d'UUID d'un niveau
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Le niveauId doit être un UUID valide.' })
  @IsNotEmpty({ message: 'Le niveauId est obligatoire.' })
  niveauId: string;
}