// src/auth/dto/register-etudiant-profile.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegisterEtudiantProfileDto {
  @ApiPropertyOptional({
    description: "Le matricule unique de l'étudiant.",
    example: "ETUD12345"
  })
  @IsOptional()
  @IsString({ message: "Le matricule doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le matricule de l'étudiant ne peut pas être vide si fourni." })
  matricule?: string;

  @ApiProperty({
    description: "L'ID du niveau (ex: L1, L2, M1) auquel l'étudiant est initialement assigné.",
    example: "6c9d8e7f-1234-5678-90ab-cdef12345678",
    format: 'uuid'
  })
  @IsUUID('4', { message: "L'ID du niveau doit être un UUID valide." })
  @IsNotEmpty({ message: "L'ID du niveau est obligatoire pour un étudiant." })
  niveauId: string; // RENOMMÉ DE classeId À niveauId
}