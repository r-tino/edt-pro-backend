// src/salles/dto/create-salle.dto.ts
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Optionnel: pour la documentation Swagger

export class CreateSalleDto {
  @ApiProperty({
    description: 'Nom unique de la salle (ex: "Amphi A", "Salle 201")',
    example: 'Amphi A'
  })
  @IsString({ message: 'Le nom de la salle doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom de la salle ne peut pas être vide.' })
  nom: string;

  @ApiProperty({
    description: 'Type de la salle (ex: "Amphithéâtre", "Salle de cours", "Laboratoire")',
    example: 'Salle de cours'
  })    
  @IsString({ message: 'Le type de la salle doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le type de la salle ne peut pas être vide.' })
  type: string;

  @ApiProperty({
    description: 'Capacité maximale de la salle en nombre de personnes',
    example: 50
  })
  @IsNumber({}, { message: 'La capacité doit être un nombre.' })
  @IsNotEmpty({ message: 'La capacité ne peut pas être vide.' })
  @Min(1, { message: 'La capacité doit être au moins de 1.' })
  capacite: number;
}