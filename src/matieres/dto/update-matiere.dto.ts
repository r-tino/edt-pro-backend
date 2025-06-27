// src/matieres/dto/update-matiere.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateMatiereDto } from './create-matiere.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateMatiereDto extends PartialType(CreateMatiereDto) {
  @ApiPropertyOptional({
    description: 'Nouveau nom de la matière',
    example: 'Algorithmique Avancée',
  })
  @IsOptional()
  @IsString({ message: 'Le nom de la matière doit être une chaîne de caractères.' })
  nom?: string; // Optionnel grâce à PartialType

  @ApiPropertyOptional({
    description: 'Nouvel ID du niveau si la matière doit être déplacée vers un autre niveau',
    example: 'fedcba98-7654-3210-fedc-ba9876543210', // Autre exemple d'UUID
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Le niveauId doit être un UUID valide.' })
  niveauId?: string; // Optionnel grâce à PartialType
}