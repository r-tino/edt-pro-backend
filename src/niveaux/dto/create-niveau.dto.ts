// src/niveaux/dto/create-niveau.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateNiveauDto {
  @ApiProperty({
    description: 'Nom du niveau (ex: L1, L2, L3, M1, M2)',
    example: 'L1',
  })
  @IsString({ message: 'Le nom du niveau doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom du niveau ne peut pas être vide.' })
  nom: string;

  @ApiProperty({
    description: 'ID du département auquel ce niveau appartient',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', // Exemple d'UUID
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Le départementId doit être un UUID valide.' })
  @IsNotEmpty({ message: 'Le départementId est obligatoire.' })
  departementId: string;
}