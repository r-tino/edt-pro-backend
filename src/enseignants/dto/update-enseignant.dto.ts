// src/enseignants/dto/update-enseignant.dto.ts
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEnseignantDto {
  @ApiPropertyOptional({
    description: "Le poste de l'enseignant (ex: 'Chef de Département Informatique').",
    example: 'Enseignant-Chercheur',
  })
  @IsOptional()
  @IsString({ message: "Le poste doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le poste ne peut pas être vide si fourni." })
  poste?: string;
}