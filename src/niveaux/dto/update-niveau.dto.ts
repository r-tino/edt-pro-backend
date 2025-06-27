// src/niveaux/dto/update-niveau.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateNiveauDto } from './create-niveau.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateNiveauDto extends PartialType(CreateNiveauDto) {
  @ApiPropertyOptional({
    description: 'Nouveau nom du niveau (ex: L1, L2, L3, M1, M2)',
    example: 'L3',
  })
  @IsOptional()
  @IsString({ message: 'Le nom du niveau doit être une chaîne de caractères.' })
  nom?: string; // Rendu optionnel par PartialType

  @ApiPropertyOptional({
    description: 'Nouvel ID du département si le niveau change de département',
    example: 'fedcba98-7654-3210-fedc-ba9876543210', // Autre exemple d'UUID
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Le départementId doit être un UUID valide.' })
  departementId?: string; // Rendu optionnel par PartialType
}