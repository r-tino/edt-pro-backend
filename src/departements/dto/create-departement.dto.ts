// src/departements/dto/create-departement.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDepartementDto {
  @ApiProperty({
    description: 'Nom du département (ex: Droit, Économie, Gestion, Sciences Sociales)',
    example: 'Droit',
  })
  @IsString({ message: 'Le nom du département doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom du département ne peut pas être vide.' })
  nom: string;
}